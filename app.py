import os
import glob
import json
from flask import Flask, request, jsonify, Response
from flask_cors import CORS
from werkzeug.utils import secure_filename
from yolo.detector import YOLOv8Detector

# 3. ENSURE STATIC FILE SERVING
app = Flask(__name__, static_folder='static', static_url_path='/static')

# 1. ENABLE CORS (expose counts header for browser webcam frame responses)
CORS(app, expose_headers=['X-Detection-Counts'])

app.config['UPLOAD_FOLDER'] = 'uploads'
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs('static/outputs', exist_ok=True)

# 6. OPTIMIZE PERFORMANCE: Reuse YOLO globally (single load, fused, warmed up in __init__)
detector = YOLOv8Detector()

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'mp4', 'avi', 'mov', 'mkv'}


def allowed_file(filename):
    """Check if the uploaded file type is supported."""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def cleanup_old_files(folder, max_files=50):
    """
    8. CLEAN OUTPUT MANAGEMENT:
    Periodically checks the output folder and deletes the oldest
    files if total files exceed `max_files`, preventing storage overflow.
    """
    try:
        files = glob.glob(os.path.join(folder, '*'))
        if len(files) > max_files:
            files.sort(key=os.path.getmtime)
            for f in files[:-max_files]:
                os.remove(f)
    except Exception as e:
        print(f"Cleanup error: {e}")


@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "success": True,
        "message": "YOLOv8 Object Detection API is running!",
        "endpoints": [
            "POST /detect/image",
            "POST /detect/video",
            "POST /detect/webcam/frame"
        ]
    }), 200


@app.route('/detect/image', methods=['POST'])
def detect_image():
    cleanup_old_files('static/outputs')

    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Invalid file type"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        output_filename, counts = detector.process_image(filepath)

        return jsonify({
            "success": True,
            "output_url": f"/static/outputs/{output_filename}",
            "counts": counts
        }), 200

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@app.route('/detect/video', methods=['POST'])
def detect_video():
    cleanup_old_files('static/outputs')

    if 'file' not in request.files:
        return jsonify({"success": False, "error": "No file uploaded"}), 400

    file = request.files['file']
    if file.filename == '':
        return jsonify({"success": False, "error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"success": False, "error": "Invalid file type"}), 400

    filename = secure_filename(file.filename)
    filepath = os.path.join(app.config['UPLOAD_FOLDER'], filename)
    file.save(filepath)

    try:
        output_filename, counts = detector.process_video(filepath)
        # STEP 6: Return response properly with full URL format
        output_url = f"{request.host_url.rstrip('/')}/static/outputs/{output_filename}"
        
        return jsonify({
            "success": True,
            "output_url": output_url,
            "counts": counts
        }), 200

    except Exception as e:
        # STEP 8: Handle failures
        return jsonify({"success": False, "error": str(e)}), 500

    finally:
        if os.path.exists(filepath):
            os.remove(filepath)


@app.route('/detect/webcam/frame', methods=['POST'])
def detect_webcam_frame():
    """
    Single frame from the browser camera (multipart file or raw JPEG body).
    Returns image/jpeg; class counts in X-Detection-Counts JSON header.
    """
    raw = None
    if 'file' in request.files and request.files['file'].filename:
        raw = request.files['file'].read()
    elif request.data and request.content_type and 'image' in request.content_type:
        raw = request.data

    if not raw:
        return jsonify({"success": False, "error": "No image data"}), 400

    try:
        jpeg_bytes, counts = detector.process_jpeg_bytes(raw)
        resp = Response(jpeg_bytes, mimetype='image/jpeg')
        resp.headers['X-Detection-Counts'] = json.dumps(counts)
        resp.headers['Cache-Control'] = 'no-store'
        return resp
    except ValueError as e:
        return jsonify({"success": False, "error": str(e)}), 400
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000, threaded=True)

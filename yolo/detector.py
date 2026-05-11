import os
import cv2
import uuid
import numpy as np
from ultralytics import YOLO


class YOLOv8Detector:
    def __init__(self, model_path='yolov8m.pt', output_dir='static/outputs'):
        """
        Initializes the YOLOv8 detector globally.
        Model is loaded once; fuse + warmup reduce first-request latency.
        """
        self.model = YOLO(model_path)
        self.output_dir = output_dir

        # Webcam / streaming: 0.3 balances speed and recall (per performance spec)
        self.conf_threshold = 0.3
        self.iou_threshold = 0.45

        # Optional micro-optimization: fuse Conv+BN layers for faster inference
        if hasattr(self.model, 'fuse'):
            self.model.fuse()

        os.makedirs(self.output_dir, exist_ok=True)

        # Model warmup — avoids multi-second stall on first real frame
        _warm = np.zeros((640, 640, 3), dtype=np.uint8)
        self.model(
            _warm,
            conf=self.conf_threshold,
            iou=self.iou_threshold,
            verbose=False,
        )

        self._jpeg_params = [int(cv2.IMWRITE_JPEG_QUALITY), 70]

    def _resize_frame(self, frame, target_width=640):
        """Resize by width while keeping aspect ratio (image / video paths)."""
        h, w = frame.shape[:2]
        if w > target_width:
            ratio = target_width / float(w)
            target_height = int(h * ratio)
            return cv2.resize(frame, (target_width, target_height))
        return frame

    @staticmethod
    def _resize_webcam_detect(frame, width=640):
        """Always resize to fixed width before detection (maintain aspect ratio)."""
        h, w = frame.shape[:2]
        if w <= 0 or h <= 0:
            return frame
        new_w = width
        new_h = max(1, int(h * width / float(w)))
        return cv2.resize(frame, (new_w, new_h))

    def process_frame_bgr(self, frame_bgr):
        """
        Run detection on a BGR image (e.g. browser webcam frame).
        Returns (jpeg_bytes, counts).
        """
        if frame_bgr is None or frame_bgr.size == 0:
            raise ValueError("Empty frame")

        resized = self._resize_webcam_detect(frame_bgr, width=640)
        results = self.model(
            resized,
            conf=self.conf_threshold,
            iou=self.iou_threshold,
            verbose=False,
        )

        counts = {}
        for box in results[0].boxes:
            cls_name = self.model.names[int(box.cls[0])]
            counts[cls_name] = counts.get(cls_name, 0) + 1

        plotted = results[0].plot(
            img=resized, conf=True, line_width=2, labels=True
        )
        ret, buf = cv2.imencode('.jpg', plotted, self._jpeg_params)
        if not ret:
            raise RuntimeError("Failed to encode result JPEG")
        return buf.tobytes(), counts

    def process_jpeg_bytes(self, jpeg_bytes):
        """Decode a JPEG from the client, run detection, return annotated JPEG bytes and counts."""
        arr = np.frombuffer(jpeg_bytes, dtype=np.uint8)
        frame = cv2.imdecode(arr, cv2.IMREAD_COLOR)
        if frame is None:
            raise ValueError("Invalid image data")
        return self.process_frame_bgr(frame)

    def process_image(self, img_path):
        """Processes an image, resizes it, draws boxes, and counts objects."""
        img = cv2.imread(img_path)
        if img is None:
            raise ValueError(f"Failed to load image from {img_path}")

        img = self._resize_frame(img, target_width=640)

        results = self.model(img, conf=self.conf_threshold, iou=self.iou_threshold, verbose=False)

        counts = {}
        for box in results[0].boxes:
            cls_name = self.model.names[int(box.cls[0])]
            conf_score = float(box.conf[0])
            print(f"Detected: {cls_name} ({conf_score:.2f})")
            counts[cls_name] = counts.get(cls_name, 0) + 1

        res_plotted = results[0].plot()
        output_filename = f"img_{uuid.uuid4().hex}.jpg"
        output_path = os.path.join(self.output_dir, output_filename)
        cv2.imwrite(output_path, res_plotted)

        return output_filename, counts

    def process_video(self, video_path):
        """Processes a video frame-by-frame and writes out an mp4 file."""
        # STEP 1: Verify video opens
        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            raise ValueError(f"Failed to open video file {video_path}")

        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        fps = int(cap.get(cv2.CAP_PROP_FPS))

        if fps == 0:
            fps = 30

        # STEP 3: Ensure dimensions match resized frame
        target_width = 640
        if width > target_width:
            ratio = target_width / float(width)
            height = int(height * ratio)
            width = target_width

        output_filename = f"vid_{uuid.uuid4().hex}.mp4"
        output_path = os.path.join(self.output_dir, output_filename)

        # STEP 4: Fix video writing formats and matching size
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        out = cv2.VideoWriter(output_path, fourcc, fps, (width, height))

        counts = {}
        frame_count = 0

        while cap.isOpened():
            success, frame = cap.read()
            if not success:
                break

            frame_count += 1

            # STEP 2: Reduce processing load
            if frame_count % 3 != 0:
                continue

            # STEP 7: Add debug logging
            print(f"Processing frame {frame_count}")

            frame = self._resize_frame(frame, target_width=640)

            results = self.model(frame, conf=self.conf_threshold, iou=self.iou_threshold, verbose=False)

            for box in results[0].boxes:
                cls_name = self.model.names[int(box.cls[0])]
                conf_score = float(box.conf[0])
                counts[cls_name] = counts.get(cls_name, 0) + 1

            res_plotted = results[0].plot()
            out.write(res_plotted)

        cap.release()
        out.release()

        # STEP 5: Ensure output is saved correctly
        if not os.path.exists(output_path):
            raise RuntimeError("Output video was not successfully written to disk.")

        return output_filename, counts

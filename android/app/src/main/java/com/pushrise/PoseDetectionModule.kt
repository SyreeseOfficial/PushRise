package com.pushrise

import android.graphics.BitmapFactory
import com.facebook.react.bridge.*
import com.google.mlkit.vision.common.InputImage
import com.google.mlkit.vision.pose.PoseDetection
import com.google.mlkit.vision.pose.PoseDetector
import com.google.mlkit.vision.pose.PoseLandmark
import com.google.mlkit.vision.pose.defaults.PoseDetectorOptions
import java.io.File

class PoseDetectionModule(reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName() = "PoseDetection"

    private val detector: PoseDetector = PoseDetection.getClient(
        PoseDetectorOptions.Builder()
            .setDetectorMode(PoseDetectorOptions.STREAM_MODE)
            .setPreferredHardwareConfigs(PoseDetectorOptions.CPU_GPU)
            .build()
    )

    @ReactMethod
    fun detectFromFile(filePath: String, promise: Promise) {
        try {
            val bitmap = BitmapFactory.decodeFile(filePath) ?: run {
                promise.reject("DECODE_ERROR", "Could not decode image")
                return
            }
            // Rotate 270° to compensate for front camera mirroring/orientation
            val image = InputImage.fromBitmap(bitmap, 270)

            detector.process(image)
                .addOnSuccessListener { pose ->
                    val result = Arguments.createMap()
                    fun addLandmark(name: String, landmark: PoseLandmark?) {
                        landmark ?: return
                        val m = Arguments.createMap()
                        m.putDouble("x", landmark.position.x.toDouble())
                        m.putDouble("y", landmark.position.y.toDouble())
                        result.putMap(name, m)
                    }
                    addLandmark("leftShoulderPosition", pose.getPoseLandmark(PoseLandmark.LEFT_SHOULDER))
                    addLandmark("leftElbowPosition", pose.getPoseLandmark(PoseLandmark.LEFT_ELBOW))
                    addLandmark("leftWristPosition", pose.getPoseLandmark(PoseLandmark.LEFT_WRIST))
                    addLandmark("rightShoulderPosition", pose.getPoseLandmark(PoseLandmark.RIGHT_SHOULDER))
                    addLandmark("rightElbowPosition", pose.getPoseLandmark(PoseLandmark.RIGHT_ELBOW))
                    addLandmark("rightWristPosition", pose.getPoseLandmark(PoseLandmark.RIGHT_WRIST))
                    promise.resolve(result)
                }
                .addOnFailureListener { e ->
                    promise.reject("DETECT_ERROR", e.message)
                }
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}

package com.tencent.iot.speech.app.asr.flash_file;

import android.media.AudioFormat;
import android.media.AudioRecord;
import android.media.MediaRecorder;
import android.os.Build;
import android.util.Log;

import com.tencent.cloud.qcloudasrsdk.filerecognize.utils.AAILogger;

import java.io.File;
import java.io.FileNotFoundException;
import java.io.FileOutputStream;
import java.io.IOException;
import java.util.concurrent.LinkedBlockingQueue;
import java.util.concurrent.ThreadPoolExecutor;
import java.util.concurrent.TimeUnit;


/**
 示例录制PCM音频
 */
public class PcmAudioRecord {

    private String TAG= PcmAudioRecord.class.getName();

    private static boolean recording = false;

    private AudioRecord audioRecord;

    private ThreadPoolExecutor mExecutor = new ThreadPoolExecutor(1, 1, 3, TimeUnit.SECONDS,
            new LinkedBlockingQueue<Runnable>());

    private int audioSource ;
    private int sampleRate;
    private int channel;
    private int audioFormat;
    private int bufferSize;
    private File mFile;

    public PcmAudioRecord() {
        this.audioSource = MediaRecorder.AudioSource.MIC;
        this.sampleRate = 16000; //设置采样率
        this.channel = AudioFormat.CHANNEL_IN_MONO;//单声道
        this.audioFormat = AudioFormat.ENCODING_PCM_16BIT;//16BIT PCM
        bufferSize = AudioRecord.getMinBufferSize(sampleRate, channel, audioFormat) * 2; //使用允许的最小值2倍作为缓冲区
        if (bufferSize < 0) {
            //无效的采样率缓存数据
            bufferSize = 0;
            AAILogger.e(TAG,"AudioRecord.getMinBufferSize error");
        }
    }


    public boolean start(File file)  {

        if (file == null){
            AAILogger.e(TAG, "AudioRecord start ERROR: "+ "file is null! ");
            return false;
        }
        if (recording ) {
            AAILogger.e(TAG, "AudioRecord start ERROR: "+ "AudioRecord multi start! ");
            return false;
        }
        mFile = file;

        /**
         *  注：这里做个判断,以规避系统bug
         *  部分android 10设备开启无障碍服务后，通过MIC或者DEFAULT获取到的音频数据为空 例如OPPO R15x, Pixel 3
         *  https://stackoverflow.com/questions/61673599/accessibilityservice-turned-on-causes-silence-from-microphone-on-android-10
         * */
        if (Build.VERSION.SDK_INT  == 29 /*Build.VERSION_CODES.Q*/) {
            audioRecord = new AudioRecord(MediaRecorder.AudioSource.VOICE_COMMUNICATION, sampleRate, channel, audioFormat, bufferSize);
        }
        else{
            audioRecord = new AudioRecord(audioSource, sampleRate, channel, audioFormat, bufferSize);
        }

        if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
            AAILogger.e(TAG, "AudioRecord start ERROR: "+ "AudioRecord init failed! ");
            return false;
        }

        recording = true;
        try {
            audioRecord.startRecording();
            savePcmToFile();
        } catch (IllegalStateException e) {
            AAILogger.e(TAG, "AudioRecord start ERROR: "+ Log.getStackTraceString(e));
            return false;
        }

        return true;
    }


    private void savePcmToFile(){
        byte[]  audioData = new byte[1280];
        mExecutor.execute(new Runnable() {
            @Override
            public void run() {
                try {
                    FileOutputStream outputStream = new FileOutputStream(mFile.getAbsoluteFile());
                    while (recording) {
                        audioRecord.read(audioData, 0, audioData.length);
                        outputStream.write(audioData);
                    }
                    outputStream.close();

                } catch (Exception e) {
                    AAILogger.e(TAG, "savePcmToFile ERROR: "+ Log.getStackTraceString(e));
                }
            }
        });
    }


    public void stop() {
        recording = false;
        if (audioRecord != null){
            audioRecord.stop();
            audioRecord.release();
        }
        audioRecord = null;
    }


}

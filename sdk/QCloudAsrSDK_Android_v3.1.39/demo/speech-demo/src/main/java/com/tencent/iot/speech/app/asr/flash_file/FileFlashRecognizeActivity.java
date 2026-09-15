package com.tencent.iot.speech.app.asr.flash_file;

import android.Manifest;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.graphics.Color;
import android.os.Bundle;
import android.support.annotation.NonNull;
import android.support.v4.app.ActivityCompat;
import android.support.v4.content.ContextCompat;
import android.support.v7.app.AppCompatActivity;

import android.util.Log;
import android.view.View;

import android.widget.Button;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;


import com.tencent.cloud.qcloudasrsdk.filerecognize.QCloudFlashRecognizer;
import com.tencent.cloud.qcloudasrsdk.filerecognize.QCloudFlashRecognizerListener;
import com.tencent.cloud.qcloudasrsdk.filerecognize.param.QCloudFlashRecognitionParams;
import com.tencent.cloud.qcloudasrsdk.filerecognize.utils.AAILogger;
import com.tencent.cloud.qcloudasrsdk.onesentence.QCloudOneSentenceRecognizerAudioPathListener;
import com.tencent.iot.speech.app.DemoConfig;
import com.tencent.iot.speech.app.R;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;

public class FileFlashRecognizeActivity extends AppCompatActivity implements QCloudFlashRecognizerListener {
    private static final String TAG = FileFlashRecognizeActivity.class.getSimpleName();
    private QCloudFlashRecognizer fileFlashRecognizer;
    private boolean isRecording = false;
    private Button mStartRec;
    private Button mRecognize;
    private PcmAudioRecord mRecord;
    private File mPcmTmpFile;


    //磁盘读写权限 麦克风录音权限
    String[] permiss = new String[]{Manifest.permission.RECORD_AUDIO};
    private int REQUEST_CODE = 1002;

    private void showLoading(boolean showLoading) {
        ProgressBar rotateLoading = findViewById(R.id.rotateloading);
        rotateLoading.setVisibility(showLoading ? View.VISIBLE : View.GONE);

    }
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        AAILogger.setNeedLogFile(true,getApplicationContext());
        AAILogger.setLogLevel(AAILogger.DEBUG_LEVEL);
        setContentView(R.layout.activity_file_flash_recognizer);


        if(!checkMyPermission(permiss)){
            ActivityCompat.requestPermissions(this,permiss, REQUEST_CODE);
        }

        mStartRec  = findViewById(R.id.recognize_start_record);
        mRecognize = findViewById(R.id.recognize_flash_file);

        if (fileFlashRecognizer == null) {
                /**直接鉴权**/
            fileFlashRecognizer = new QCloudFlashRecognizer(DemoConfig.apppId, DemoConfig.secretId, DemoConfig.secretKey);

               /**使用临时密钥鉴权
                * * 1.通过sts 获取到临时证书 （secretId secretKey  token） ,此步骤应在您的服务器端实现，见https://cloud.tencent.com/document/product/598/33416
                *   2.通过临时密钥调用接口
                * **/
//            fileFlashRecognizer = new QCloudFlashRecognizer(DemoConfig.apppId, "临时secretId", "临时secretKey","对应的token");

            fileFlashRecognizer.setCallback(this);
        }
        System.out.println(Thread.currentThread());

        findViewById(R.id.recognize_flash_file).setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                InputStream is = null;
                try {
                    AssetManager am = getResources().getAssets();
                    is = am.open("test2.mp3");
                    int length = is.available();
                    byte[] audioData = new byte[length];
                    is.read(audioData);

                    QCloudFlashRecognitionParams params = (QCloudFlashRecognitionParams) QCloudFlashRecognitionParams.defaultRequestParams();

                    /**支持传音频文件数据或者音频文件路径，如果同时调用setData和setPath，sdk内将忽略setPath
                     *  音频文件支持100M以内的文件，如果使用setData直接传音频文件数据，需要避免数据过大引发OOM，大文件建议传路径
                     *  setVoiceFormat必须正确，否则服务器端将无法解析
                     *  参数解释详解API文档https://cloud.tencent.com/document/product/1093/52097
                     * **/
                    params.setData(audioData);
//                    params.setPath("/sdcard/test2.mp3"); //需要读写权限
                    params.setVoiceFormat("mp3"); //音频格式。支持 wav、pcm、ogg-opus、speex、silk、mp3、m4a、aac。

                    /**以下参数不设置将使用默认值**/
//                    params.setEngineModelType("16k_zh");//引擎模型类型,默认16k_zh。8k_zh：8k 中文普通话通用；16k_zh：16k 中文普通话通用；16k_zh_video：16k 音视频领域。
//                    params.setFilterDirty(0);// 0 ：默认状态 不过滤脏话 1：过滤脏话
//                    params.setFilterModal(0);// 0 ：默认状态 不过滤语气词  1：过滤部分语气词 2:严格过滤
//                    params.setFilterPunc(0);// 0 ：默认状态 不过滤句末的句号 1：滤句末的句号
//                    params.setConvertNumMode(1);//1：默认状态 根据场景智能转换为阿拉伯数字；0：全部转为中文数字。
//                    params.setSpeakerDiarization(0); //是否开启说话人分离（目前支持中文普通话引擎），默认为0，0：不开启，1：开启。
//                    params.setFirstChannelOnly(1); //是否只识别首个声道，默认为1。0：识别所有声道；1：识别首个声道。
//                    params.setWordInfo(0); //是否显示词级别时间戳，默认为0。0：不显示；1：显示，不包含标点时间戳，2：显示，包含标点时间戳。

                    /**网络超时时间。
                     * 注意：如果设置过短的时间，网络超时断开将无法获取到识别结果;
                     * 如果网络断开前音频文件已经上传完成，将会消耗该音频时长的识别额度
                     * **/
//                    params.setConnectTimeout(30 * 1000);//单位:毫秒，默认30秒
//                    params.setReadTimeout(600 * 1000);//单位:毫秒，默认10分钟
//                    params.setReinforceHotword(1); // 开启热词增强
//                    params.setSentenceMaxLength(10);

                    long ret = 0;
                    ret = fileFlashRecognizer.recognize(params);

                    if (ret >= 0) {
                        showLoading(true);
                        mStartRec.setEnabled(false);
                        mRecognize.setEnabled(false);
                    }
                } catch (Exception e) {
                    showLoading(false);
                    onMessage("录音文件不存在");
                    AAILogger.e(TAG, "error: " + Log.getStackTraceString(e));
                } finally {
                    try {
                        if (is != null) is.close();
                    } catch (IOException e) {
                        AAILogger.e(TAG, "error: " + Log.getStackTraceString(e));
                    }
                }
            }
        });

        /**演示录制pcm音频并识别，具体参数说明同上，以下不再重复标注**/
        findViewById(R.id.recognize_start_record).setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {

                if (!isRecording){

                    if (mRecord == null){
                        mRecord = new PcmAudioRecord(); //调用系统录音器录音，调用前请先申请权限
                    }
                    try {
                        mPcmTmpFile = File.createTempFile("pcm_temp", ".pcm");
                        boolean ret = mRecord.start(mPcmTmpFile);
                        if (ret == false){
                            onMessage("录音器启动失败,请检查权限");
                            return;
                        }
                        isRecording = true;
                        showLoading(true);
                        mRecognize.setEnabled(false);
                        mStartRec.setText("stopRecord");
                    } catch (IOException e) {
                        AAILogger.e(TAG, "error: " + Log.getStackTraceString(e));
                        mStartRec.setEnabled(true);
                        mRecognize.setEnabled(true);
                    }
                } else {
                    if (mRecord == null){
                        mStartRec.setEnabled(true);
                        mRecognize.setEnabled(true);
                        return;
                    }
                    mRecord.stop();
                    QCloudFlashRecognitionParams params = (QCloudFlashRecognitionParams) QCloudFlashRecognitionParams.defaultRequestParams();
                    params.setPath(mPcmTmpFile.getPath()); //需要读写权限
                    params.setVoiceFormat("pcm");
                    try {
                        long ret = fileFlashRecognizer.recognize(params);
                        if (ret >= 0) {
                            showLoading(true);
                            mStartRec.setEnabled(false);
                            mRecognize.setEnabled(false);
                            isRecording = false;
                            Button btn  = findViewById(R.id.recognize_start_record);
                            btn.setText("startRecord");
                            showLoading(true);
                            mStartRec.setEnabled(false);
                        }
                    } catch (Exception e) {
                        AAILogger.e(TAG, "error: " + Log.getStackTraceString(e));
                    }
                }
            }
        });

    }



    //录音文件识别结果回调 ，详见api文档 https://cloud.tencent.com/document/product/1093/52097
    @Override
    public void recognizeResult(QCloudFlashRecognizer recognizer,  String result, Exception exception) {
        showLoading(false);
        mStartRec.setEnabled(true);
        mRecognize.setEnabled(true);
        Log.i(this.getClass().getName(), result);

        TextView textView = findViewById(R.id.recognize_flash_text_view);
        if (exception != null){
            textView.setText(exception.getLocalizedMessage());
        }else {
            textView.setText(result);
        }
        if (mPcmTmpFile != null){
            mPcmTmpFile.delete();
            mPcmTmpFile = null;
        }

    }

    public void onMessage(final String msg) {
        runOnUiThread(new Runnable() {
            public void run() {
                Toast.makeText(FileFlashRecognizeActivity.this, msg, Toast.LENGTH_SHORT).show();
            }
        });
    }

    private boolean checkMyPermission(String[] permiss){
        if(permiss !=null && permiss.length > 0 ){
            for(String per : permiss) {
                if (ContextCompat.checkSelfPermission(this, per) != PackageManager.PERMISSION_GRANTED){
                    return false;
                }
            }
        }
        return true;
    }
    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults){
        if (requestCode == REQUEST_CODE) {
            boolean isAllGranted = true;
            // 判断是否所有的权限都已经授予了
            for (int grant : grantResults) {
                if (grant != PackageManager.PERMISSION_GRANTED) {
                    isAllGranted = false;
                    break;
                }
            }
            if (isAllGranted) {
            } else {
                // 弹出对话框告诉用户需要权限的原因, 并引导用户去应用权限管理中手动打开权限按钮
            }
        }
    }
}

package com.tencent.iot.speech.app.asr.sentence;

import android.Manifest;
import android.app.AlertDialog;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.res.AssetManager;
import android.graphics.Color;
import android.media.MediaRecorder;
import android.net.Uri;
import android.os.Bundle;
import android.provider.Settings;
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

import com.tencent.cloud.qcloudasrsdk.onesentence.QCloudOneSentenceRecognizer;
import com.tencent.cloud.qcloudasrsdk.onesentence.QCloudOneSentenceRecognizerAudioPathListener;
import com.tencent.cloud.qcloudasrsdk.onesentence.QCloudOneSentenceRecognizerListener;
import com.tencent.cloud.qcloudasrsdk.onesentence.common.QCloudAudioFrequence;
import com.tencent.cloud.qcloudasrsdk.onesentence.common.QCloudSourceType;
import com.tencent.cloud.qcloudasrsdk.onesentence.network.QCloudOneSentenceRecognitionParams;
import com.tencent.cloud.qcloudasrsdk.onesentence.utils.AAILogger;
import com.tencent.iot.speech.app.DemoConfig;
import com.tencent.iot.speech.app.R;

import java.io.File;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;

public class OneSentenceRecognizeActivity extends AppCompatActivity implements QCloudOneSentenceRecognizerListener {

    private boolean recording = false;

    private static final String TAG = OneSentenceRecognizeActivity.class.getSimpleName();

    private QCloudOneSentenceRecognizer recognizer;
    private MediaRecorder mediaRecorder;
    private String audioPath;

    private int REQUEST_CODE = 1002;
    //磁盘读写权限 麦克风录音权限
    String[] permiss = new String[]{
//      Manifest.permission.READ_EXTERNAL_STORAGE,
//      Manifest.permission.WRITE_EXTERNAL_STORAGE,
        Manifest.permission.RECORD_AUDIO};
    private void showLoading(boolean showLoading) {
        ProgressBar rotateLoading = findViewById(R.id.rotateloading);
        if (showLoading) {
            Button btn = findViewById(R.id.recognize_ur_btn);
            btn.setEnabled(false);
            btn = findViewById(R.id.recognize_ur_data);
            btn.setEnabled(false);
            btn = findViewById(R.id.recognize_start_record);
            btn.setEnabled(false);
            btn = findViewById(R.id.recognize_start_record_2);
            btn.setEnabled(false);
            rotateLoading.setVisibility(View.VISIBLE);
        } else {
            Button btn = findViewById(R.id.recognize_ur_btn);
            btn.setEnabled(true);
            btn = findViewById(R.id.recognize_ur_data);
            btn.setEnabled(true);
            btn = findViewById(R.id.recognize_start_record);
            btn.setEnabled(true);
            btn = findViewById(R.id.recognize_start_record_2);
            btn.setEnabled(true);
            rotateLoading.setVisibility(View.GONE);
        }
    }
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_one_sentence_recognize);
        AAILogger.setNeedLogFile(true,getApplicationContext());
        AAILogger.setLogLevel(AAILogger.DEBUG_LEVEL);
        if(!checkMyPermission(permiss)){
            ActivityCompat.requestPermissions(this,permiss, REQUEST_CODE);
        }

        if (recognizer == null) {
            /**直接鉴权**/
            recognizer = new QCloudOneSentenceRecognizer(this, DemoConfig.apppId, DemoConfig.secretId, DemoConfig.secretKey);

            /**使用临时密钥鉴权
             * * 1.通过sts 获取到临时证书 （secretId secretKey  token） ,此步骤应在您的服务器端实现，见https://cloud.tencent.com/document/product/598/33416
             *   2.通过临时密钥调用接口
             * **/
//            recognizer = new QCloudOneSentenceRecognizer(this,DemoConfig.apppId, "临时secretId", "临时secretKey","对应的token");


            recognizer.setCallback(this);
        }

        System.out.println(Thread.currentThread());

        findViewById(R.id.recognize_ur_btn).setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                try {
                    showLoading(true);

                    QCloudOneSentenceRecognitionParams params = (QCloudOneSentenceRecognitionParams) QCloudOneSentenceRecognitionParams.defaultRequestParams();
                    params.setUrl("http://liqiansunvoice-1255628450.cosgz.myqcloud.com/30s.wav");
                    params.setSourceType(QCloudSourceType.QCloudSourceTypeUrl);
                    params.setFilterDirty(0);// 0 ：默认状态 不过滤脏话 1：过滤脏话
                    params.setFilterModal(0);// 0 ：默认状态 不过滤语气词  1：过滤部分语气词 2:严格过滤
                    params.setFilterPunc(0); // 0 ：默认状态 不过滤句末的句号 1：滤句末的句号
                    params.setConvertNumMode(1);//1：默认状态 根据场景智能转换为阿拉伯数字；0：全部转为中文数字。
                    params.setHotwordId("1335468b9e7c11ea9ae9446a2eb5fd98"); // 热词id。用于调用对应的热词表，如果在调用语音识别服务时，不进行单独的热词id设置，自动生效默认热词；如果进行了单独的热词id设置，那么将生效单独设置的热词id。
                    params.setVoiceFormat("wav");
                    params.setSourceType(QCloudSourceType.QCloudSourceTypeUrl);
                    params.setEngSerViceType(QCloudAudioFrequence.QCloudAudioFrequence16k.getFrequence());
                    params.setReinforceHotword(1); // 开启热词增强功能
                    recognizer.recognize(params);

//                    recognizer.recognize("http://liqiansunvoice-1255628450.cosgz.myqcloud.com/30s.wav", QCloudAudioFormat.QCloudAudioFormatWav, QCloudAudioFrequence.QCloudAudioFrequence16k.getFrequence());
                } catch (Exception e) {
                    AAILogger.e(TAG, "error: " + Log.getStackTraceString(e));
                }
            }
        });


        findViewById(R.id.recognize_ur_data).setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                InputStream is = null;
                try {
                    showLoading(true);
                    AssetManager am = getResources().getAssets();
                    is = am.open("test1.mp3");
                    int length = is.available();
                    byte[] audioData = new byte[length];
                    is.read(audioData);
                    //配置识别参数,详细参数说明见： https://cloud.tencent.com/document/product/1093/35646
                    QCloudOneSentenceRecognitionParams  params = (QCloudOneSentenceRecognitionParams)QCloudOneSentenceRecognitionParams.defaultRequestParams();
                    params.setFilterDirty(0);// 0 ：默认状态 不过滤脏话 1：过滤脏话
                    params.setFilterModal(0);// 0 ：默认状态 不过滤语气词  1：过滤部分语气词 2:严格过滤
                    params.setFilterPunc(1); // 0 ：默认状态 不过滤句末的句号 1：滤句末的句号
                    params.setConvertNumMode(0);//1：默认状态 根据场景智能转换为阿拉伯数字；0：全部转为中文数字。
//                    params.setHotwordId(""); // 热词id。用于调用对应的热词表，如果在调用语音识别服务时，不进行单独的热词id设置，自动生效默认热词；如果进行了单独的热词id设置，那么将生效单独设置的热词id。
                    params.setData(audioData);
                    params.setVoiceFormat("mp3");//识别音频的音频格式，支持wav、pcm、ogg-opus、speex、silk、mp3、m4a、aac。
                    params.setSourceType(QCloudSourceType.QCloudSourceTypeData);
                    params.setEngSerViceType("16k_zh"); //默认16k_zh，更多引擎参数详见https://cloud.tencent.com/document/product/1093/35646 内的EngSerViceType字段
                    params.setReinforceHotword(1); // 开启热词增强功能
                    recognizer.recognize(params);
                }catch (Exception e) {
                    AAILogger.e(TAG, "error: " + Log.getStackTraceString(e));
                }
                finally {
                    try {
                        is.close();
                    } catch (IOException e) {
                        AAILogger.e(TAG, "error: " + Log.getStackTraceString(e));
                    }
                }
            }
        });
        findViewById(R.id.recognize_start_record).setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                try {
                    if (recording) {
                        recognizer.stopRecognizeWithRecorder();
                    } else {
                        /**
                         * setDefaultParams 默认参数param
                         * @param filterDirty    0 ：默认状态 不过滤脏话 1：过滤脏话
                         * @param filterModal    0 ：默认状态 不过滤语气词  1：过滤部分语气词 2:严格过滤
                         * @param filterPunc     0 ：默认状态 不过滤句末的句号 1：滤句末的句号
                         * @param convertNumMode 1：默认状态 根据场景智能转换为阿拉伯数字；0：全部转为中文数字。
                         * @param hotwordId  热词id，不使用则传null
                         * @param engSerViceType  引擎模型类型，传null默认使用“16k_zh”
                         */
                        recognizer.setDefaultParams(0, 0, 1, 1,null,null);
                        recognizer.getDefaultParams().setReinforceHotword(1); // 开启热词增强
                        showLoading(true);
                        recognizer.recognizeWithRecorder();
                        recognizer.setQCloudOneSentenceRecognizerAudioPathListener(new QCloudOneSentenceRecognizerAudioPathListener() {
                            @Override
                            public void callBackAudioPath(String audioPath) {
                                AAILogger.d(TAG, "callBackAudioPath: audioPath="+audioPath);
                            }
                        });
                    }
                } catch (Exception e) {
                    showLoading(false);
                    AAILogger.e(TAG, "error: " + Log.getStackTraceString(e));
                } 
            }
        });
        findViewById(R.id.recognize_start_record_2).setOnClickListener(new View.OnClickListener() {
            public void onClick(View v) {
                try {
                    if (recording) {
                        ((Button)v).setText("startRecord(MediaRecroder)");
                        v.setEnabled(false);
                        mediaRecorder.stop();
                        mediaRecorder.release();
                        mediaRecorder = null;
                        recording = false;
                        File audioFile = new File(audioPath);
                        FileInputStream fs = new FileInputStream(audioFile);
                        byte[] audioData = new byte[fs.available()];
                        fs.read(audioData);
                        QCloudOneSentenceRecognitionParams  params = (QCloudOneSentenceRecognitionParams)QCloudOneSentenceRecognitionParams.defaultRequestParams();
                        params.setFilterDirty(0);// 0 ：默认状态 不过滤脏话 1：过滤脏话
                        params.setFilterModal(0);// 0 ：默认状态 不过滤语气词  1：过滤部分语气词 2:严格过滤
                        params.setFilterPunc(1); // 0 ：默认状态 不过滤句末的句号 1：滤句末的句号
                        params.setConvertNumMode(0);//1：默认状态 根据场景智能转换为阿拉伯数字；0：全部转为中文数字。
//                    params.setHotwordId(""); // 热词id。用于调用对应的热词表，如果在调用语音识别服务时，不进行单独的热词id设置，自动生效默认热词；如果进行了单独的热词id设置，那么将生效单独设置的热词id。
                        params.setData(audioData);
                        params.setVoiceFormat("amr");//识别音频的音频格式，支持wav、pcm、ogg-opus、speex、silk、mp3、m4a、aac、amr。
                        params.setSourceType(QCloudSourceType.QCloudSourceTypeData);
                        params.setEngSerViceType("16k_zh"); //默认16k_zh，更多引擎参数详见https://cloud.tencent.com/document/product/1093/35646 内的EngSerViceType字段
                        recognizer.recognize(params);
                    }
                    else{
                        mediaRecorder = new MediaRecorder();
                        mediaRecorder.setAudioSource(MediaRecorder.AudioSource.MIC);
                        mediaRecorder.setOutputFormat(MediaRecorder.OutputFormat.AMR_NB);
                        mediaRecorder.setAudioEncoder(MediaRecorder.AudioEncoder.AMR_NB);
                        File audioFile = new File(OneSentenceRecognizeActivity.this.getFilesDir(), "recorder.m4a");
                        audioPath = audioFile.getAbsolutePath();
                        mediaRecorder.setOutputFile(audioPath);
                        mediaRecorder.prepare();
                        mediaRecorder.start();
                        recording = true;
                        showLoading(true);
                        v.setEnabled(true);
                        ((Button)v).setText("stopRecrod");
                    }
                } catch (Exception e) {
                    AAILogger.e(TAG, "error: " + Log.getStackTraceString(e));
                }
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
            if (!isAllGranted) {
                // 弹出对话框告诉用户需要权限的原因, 并引导用户去应用权限管理中手动打开权限按钮
                openAppDetails();
            }
        }
    }

    /**
     * 打开 APP 的详情设置
     */
    private void openAppDetails() {
        AlertDialog.Builder builder = new AlertDialog.Builder(this);
        builder.setMessage("录音需要访问 “录音设备”，请到 “应用信息 -> 权限” 中授予！");
        builder.setPositiveButton("去手动授权", new DialogInterface.OnClickListener() {
            @Override
            public void onClick(DialogInterface dialog, int which) {
                Intent intent = new Intent();
                intent.setAction(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                intent.addCategory(Intent.CATEGORY_DEFAULT);
                intent.setData(Uri.parse("package:" + getPackageName()));
                intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                intent.addFlags(Intent.FLAG_ACTIVITY_NO_HISTORY);
                intent.addFlags(Intent.FLAG_ACTIVITY_EXCLUDE_FROM_RECENTS);
                startActivity(intent);
            }
        });
        builder.setNegativeButton("取消", null);
        builder.show();
    }

    @Override
    protected void onStart() {
        super.onStart();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
    }

    @Override
    public void didStartRecord() {
        recording = true;
        Toast.makeText(getApplicationContext(), "开始录音!", Toast.LENGTH_SHORT).show();
        Button recordButton = findViewById(R.id.recognize_start_record);
        recordButton.setText("stopRecord");
        recordButton.setEnabled(true);
    }

    @Override
    public void didStopRecord() {
        recording = false;
        Toast.makeText(getApplicationContext(), "停止录音!", Toast.LENGTH_SHORT).show();
    }

    /*一句话识别结果回调*/
    @Override
    public void recognizeResult(QCloudOneSentenceRecognizer recognizer, String result, Exception exception)  {
        showLoading(false);
        Button recordButton = findViewById(R.id.recognize_start_record);
        recordButton.setText("startRecord");
        recordButton.setEnabled(true);
        TextView textView = findViewById(R.id.recognize_text_view);
        AAILogger.e("recognizeResult","thread id:" + Thread.currentThread().getId() + " name:" + Thread.currentThread().getName());
        if (exception != null) {
            AAILogger.e(TAG,"result: " + result + "exception msg: " + exception + exception.getLocalizedMessage());
            textView.setText(exception.getLocalizedMessage());
        } else {
            AAILogger.e(TAG,"result: " + result);
            textView.setText(result);
        }
    }

    @Override
    public void didUpdateVolume(int volumn) {
        AAILogger.i("Volumn:", "" + volumn);
    }

}

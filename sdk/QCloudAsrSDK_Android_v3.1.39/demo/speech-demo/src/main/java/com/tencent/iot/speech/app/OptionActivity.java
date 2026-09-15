package com.tencent.iot.speech.app;

import android.content.Intent;
import android.os.Bundle;
import android.support.v7.app.AppCompatActivity;
import android.view.View;
import android.widget.AdapterView;
import android.widget.ArrayAdapter;
import android.widget.CheckBox;
import android.widget.ListView;


import com.tencent.iot.speech.app.asr.flash_file.FileFlashRecognizeActivity;
import com.tencent.iot.speech.app.asr.realtime.MainActivity;
import com.tencent.iot.speech.app.asr.sentence.OneSentenceRecognizeActivity;

public class OptionActivity extends AppCompatActivity {
    private ListView listView;
    private CheckBox mDeviceAuthCheckBox;
    private String datas[]={ "一句话识别","录音文件识别极速版","实时语音识别"};
    private ArrayAdapter<String> adapter;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_option);


        listView = (ListView)findViewById(R.id.lv);

        //实例化ArrayAdapter
        adapter = new ArrayAdapter<String>(this,android.R.layout.simple_list_item_1,datas);
        //设置适配器
        listView.setAdapter(adapter);
        listView.setOnItemClickListener(new AdapterView.OnItemClickListener() {
            @Override
            public void onItemClick(AdapterView<?> parent, View view, int position, long id) {
                Intent intent;
                if (0 == position) {
                    //显示方式声明Intent，直接启动SecondActivity
                    intent = new Intent(OptionActivity.this, OneSentenceRecognizeActivity.class);
                } else if (1 == position){
                    intent = new Intent(OptionActivity.this, FileFlashRecognizeActivity.class);
                } else {
                    intent = new Intent(OptionActivity.this, MainActivity.class);
                }
                startActivity(intent);
            }
        });
    }
}

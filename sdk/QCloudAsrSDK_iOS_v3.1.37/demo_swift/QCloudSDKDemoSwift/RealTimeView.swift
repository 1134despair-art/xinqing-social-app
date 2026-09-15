//
//  RealTimeView.swift
//  QCloudSDKDemoSwift
//
//  Created by tbolp on 2023/3/27.
//

import SwiftUI
import AVFAudio

class QCloudRealTimeObservation: NSObject, QCloudRealTimeRecognizerDelegate, ObservableObject {
    
    enum STATE {
        case PREPARE;
        case RUNNING;
        case PERFORM;
    }
    
    @Published var result = "";
    @Published var state = STATE.PREPARE;
    @Published var btn_text = "开始识别";
    @Published var enableVolumeDetect = false
    @Published var enableSilenceDetect = false
    @Published var volume: Float = 0.0
    
    func realTimeRecognizer(onSliceRecognize recognizer: QCloudRealTimeRecognizer, result: QCloudRealTimeResult) {
        self.result = result.recognizedText;
    }
    
    func realTimeRecognizer(onSegmentSuccessRecognize recognizer: QCloudRealTimeRecognizer, result: QCloudRealTimeResult) {
    }
    
    func realTimeRecognizerDidUpdateVolumeDB(_ recognizer: QCloudRealTimeRecognizer, volume: Float) {
        self.volume = volume
    }
    
    func realTimeRecognizerDidError(_ recognizer: QCloudRealTimeRecognizer, result: QCloudRealTimeResult) {
        self.state = STATE.PREPARE
        self.btn_text = "开始识别"
        self.result = result.clientErrMessage
    }
    
    func realTimeRecognizerDidFinish(_ recognizer: QCloudRealTimeRecognizer, result: String) {
        self.btn_text = "开始识别";
        self.state = STATE.PREPARE;
    }
    
    
    func realTimeRecognizer(onFlowRecognizeStart recognizer: QCloudRealTimeRecognizer, voiceId: String, seq: Int) {
        self.btn_text = "停止识别";
        self.state = STATE.RUNNING;
    }
}

struct RealTimeView: View {
    @ObservedObject var observation = QCloudRealTimeObservation();
    @State var recognizer: QCloudRealTimeRecognizer? = nil;
    var body: some View {
        VStack(spacing:10){
            HStack{
                Button(self.observation.btn_text){
                    if(self.observation.state == .PREPARE){
                        let config = QCloudConfig(appId: Config.appID, secretId: Config.secretID, secretKey: Config.secretKey, projectId: 0)
                        config.sliceTime = 40
                        config.enableDetectVolume = self.observation.enableVolumeDetect
                        config.endRecognizeWhenDetectSilence = self.observation.enableSilenceDetect
                        config.endRecognizeWhenDetectSilenceAutoStop = true
                        config.silenceDetectDuration = 3.0
                        config.requestTimeout = 10;
                        config.engineType = "16k_zh";
                        config.requestTimeout = 5;//设置网络超时时间
                        self.observation.result = "";
                        self.recognizer =  QCloudRealTimeRecognizer.init(config: config);
                        self.recognizer!.delegate = self.observation;
                        do{
                            try AVAudioSession.sharedInstance().setCategory(.record)
                            try AVAudioSession.sharedInstance().setActive(true);
                        }catch {
                            self.observation.result = "设置录音category失败"
                            return;
                        }
                        self.observation.state = .PERFORM;
                        recognizer!.start();
                    }else if(self.observation.state == .RUNNING){
                        self.observation.state = .PERFORM;
                        self.recognizer!.stop();
                    }
                    
                }
                .buttonStyle(.borderedProminent)
                .frame(alignment: .leading)
                .disabled(self.observation.state == .PERFORM)
                Spacer()
            }
            .frame(maxWidth: .infinity, alignment: .leading)
            Toggle("音量检测", isOn: $observation.enableVolumeDetect)
                .disabled(observation.state == .RUNNING)
                .padding(.bottom, 8)
            
            Toggle("静音检测", isOn: $observation.enableSilenceDetect)
                .disabled(observation.state == .RUNNING)
                .padding(.bottom, 8)
            
            if observation.enableVolumeDetect {
                VStack(alignment: .leading) {
                    Text("当前音量: \(observation.volume, specifier: "%.2f")")
                }
                .padding(.bottom, 8)
            }
            
            Text("结果 :").frame(maxWidth: .infinity, alignment: .leading)
            ScrollView {
                Text(observation.result)
                    .frame(maxWidth: .infinity, alignment: .leading)
            }
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding(.top, 40)
        .onAppear(perform: {
            self.observation.state = .PREPARE;
            self.observation.btn_text = "开始识别"
        })
        .onDisappear {
            self.observation.state = .PREPARE;
            recognizer?.stop()
        }
    }
}

struct RealTimeView_Previews: PreviewProvider {
    static var previews: some View {
        RealTimeView()
    }
    
}

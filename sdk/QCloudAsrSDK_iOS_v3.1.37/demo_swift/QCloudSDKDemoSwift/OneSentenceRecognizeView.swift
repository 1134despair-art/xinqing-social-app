//
//  OneSentenceRecognizeView.swift
//  QCloudSDKDemoSwift
//
//  Created by sunnydu on 2025/9/4.
//

import Foundation
import SwiftUI
import AVFAudio

class QCloudOneSentenceObservation: NSObject, QCloudSentenceRecognizerDelegate, ObservableObject {
    @Published var isRecording = false
    @Published var resultText = ""
    @Published var btn_text = "开始识别";
    var recognizer: QCloudSentenceRecognizer?
//    - (void)oneSentenceRecognizerDidRecognize:(QCloudSentenceRecognizer *)recognizer text:(nullable NSString *)text error:(nullable NSError *)error resultData:(nullable NSDictionary *)resultData;
    func oneSentenceRecognizerDidRecognize(_ recognizer: QCloudSentenceRecognizer, text: String?, error: Error?, resultData: [AnyHashable : Any]?) {
        DispatchQueue.main.async { [weak self] in
            self?.resultText = text ?? "识别失败"
            self?.isRecording = false
        }
    }
}

struct OneSentenceRecognizeView: View {
    @ObservedObject var observation = QCloudOneSentenceObservation()
    
    var body: some View {
        VStack(spacing: 20) {
            HStack{
                Button(self.observation.btn_text){
                    AVAudioSession.sharedInstance().requestRecordPermission { granted in
                            guard granted else {
                                return
                            }
                        if observation.isRecording {
                            self.observation.recognizer?.stopRecognizeWithRecorder()
                            observation.isRecording = false
                            observation.btn_text = "一句话识别(开始录音)"
                        } else {
                            observation.btn_text = "结束识别"
                            do {
                                try AVAudioSession.sharedInstance().setCategory(.record)
                                try AVAudioSession.sharedInstance().setActive(true)
                                self.observation.recognizer?.startRecognize(withRecorder: "16k_zh")
                                observation.isRecording = true
                            } catch let error as NSError {
                                self.observation.resultText = "录音启动失败: \(error.localizedDescription)"
                                self.observation.isRecording = false
                            }
                        }
                    }
                }.buttonStyle(.borderedProminent)
                    .frame(alignment: .leading)
                    Spacer()
            }
            ScrollView {
                Text(observation.resultText)
                    .frame(maxWidth: .infinity, alignment: .leading)
                    .padding()
            }
            .frame(maxHeight: 200)
            
            Spacer()
        }
        .padding()
        .onAppear(perform: setupRecognizer)
    }
    
    private func setupRecognizer() {
        let config = QCloudSentenceRecognizeParams()
        config.engSerViceType = "16k_zh"
        observation.recognizer = QCloudSentenceRecognizer(
            appId: Config.appID,
            secretId: Config.secretID,
            secretKey: Config.secretKey
        )
        observation.recognizer?.delegate = observation
    }
    
}

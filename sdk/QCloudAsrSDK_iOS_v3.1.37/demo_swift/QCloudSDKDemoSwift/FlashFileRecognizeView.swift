//
//  FlashFileRecognizeView.swift
//  QCloudSDKDemoSwift
//
//  Created by sunnydu on 2025/9/4.
//

import Foundation
import SwiftUI

class FlashFileRecognizeObservation: NSObject, QCloudFlashFileRecognizerDelegate, ObservableObject {
    @Published var isRecording = false
    @Published var resultText = "sunnydu"
    @Published var btn_text = "开始识别";
    var recognizer: QCloudFlashFileRecognizer?
    

    @objc(flashFileRecognizer:status:text:resultData:)
    func flashFileRecognizer(_ recognizer: QCloudFlashFileRecognizer?, status: UnsafeMutablePointer<Int>?, text: String?, resultData: [String : Any]?) {
        DispatchQueue.main.async {
            self.resultText = text ?? ""
        }
    }

    @objc(flashFileRecognizer:error:resultData:)
    func flashFileRecognizer(_ recognizer: QCloudFlashFileRecognizer?, error: Error?, resultData: [String : Any]?) {
        DispatchQueue.main.async {
            self.resultText = "发生错误: \(error?.localizedDescription ?? "未知错误")"
        }
    }
    
}

struct FlashFileRecognizeView: View {
    @ObservedObject var observation = FlashFileRecognizeObservation()
    var body: some View {
        VStack(spacing: 20) {
            HStack{
                Button(self.observation.btn_text){
                    guard let url = Bundle.main.url(forResource: "test1", withExtension: "mp3"),
                          let audioData = try? Data(contentsOf: url) else {
                        observation.resultText = "文件加载失败"
                        return
                    }
                    let params = QCloudFlashFileRecognizeParams.defaultRequest()
                    params.audioData = audioData
                    params.voiceFormat = "mp3"
                    
                    observation.recognizer?.recognize(params)
                }.buttonStyle(.borderedProminent)
                    .frame(alignment: .leading)
                    Spacer()
            }
     
            
            Text(observation.resultText)
                .padding()
                .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding()
        .onAppear(perform: setupRecognizer)
    }
    
    private func setupRecognizer() {
        observation.recognizer = QCloudFlashFileRecognizer(appId: Config.appID,
                                              secretId: Config.secretID,
                                              secretKey: Config.secretKey)
        observation.recognizer?.delegate = observation
    }
}

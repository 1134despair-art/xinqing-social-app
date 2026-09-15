//
//  ContentView.swift
//  QCloudSDKDemoSwift
//
//  Created by tbolp on 2023/3/27.
//

import SwiftUI

struct ContentView: View {
    var body: some View {
        NavigationView{
            VStack(spacing: 20) {
                NavigationLink(destination: OneSentenceRecognizeView()) {
                    Text("一句话识别").frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                
                NavigationLink(destination: RealTimeView()) {
                    Text("实时语音识别").frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                
                NavigationLink(destination: FlashFileRecognizeView()) {
                    Text("录音文件识别").frame(maxWidth: .infinity)
                }
                .buttonStyle(.borderedProminent)
                
                Spacer()
            }
            .frame(maxWidth: .infinity)
            .padding()
            .navigationTitle("Demo")
        }
        .frame(alignment: .top)
    }
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        Group {
            ContentView()
                .previewInterfaceOrientation(.portrait)
        }
    }
}

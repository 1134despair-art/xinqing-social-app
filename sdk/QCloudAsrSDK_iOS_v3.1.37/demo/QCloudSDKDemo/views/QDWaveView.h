
#import <UIKit/UIKit.h>

@interface QDWaveView : UIView

@property (nonatomic, strong) void (^waverLevelCallback)(QDWaveView * waver);

@property (nonatomic) NSUInteger numberOfWaves;

@property (nonatomic) UIColor * waveColor;

@property (nonatomic) CGFloat level;

@property (nonatomic) CGFloat mainWaveWidth;

@property (nonatomic) CGFloat decorativeWavesWidth;

@property (nonatomic) CGFloat idleAmplitude;

@property (nonatomic) CGFloat frequency;

@property (nonatomic, readonly) CGFloat amplitude;

@property (nonatomic) CGFloat density;

@property (nonatomic) CGFloat phaseShift;

@property (nonatomic, readonly) NSMutableArray * waves;

- (void)startAnimation;

- (void)stopAnimation;

@end

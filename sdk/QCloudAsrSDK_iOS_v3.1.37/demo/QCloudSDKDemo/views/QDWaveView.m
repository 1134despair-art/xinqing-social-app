#import "QDWaveView.h"

@interface QDWaveView ()

@property (nonatomic) CGFloat phase;
@property (nonatomic) CGFloat amplitude;
@property (nonatomic) NSMutableArray * waves;
@property (nonatomic) CGFloat waveHeight;
@property (nonatomic) CGFloat waveWidth;
@property (nonatomic) CGFloat waveMid;
@property (nonatomic) CGFloat maxAmplitude;
@property (nonatomic, strong) CADisplayLink *displayLink;

@end

@implementation QDWaveView

- (void)dealloc
{
    NSLog(@"MWWaveView dealloc");
    [_displayLink invalidate];
}

- (id)init
{
    if(self = [super init]) {
        [self setup];
    }
    
    return self;
}

- (id)initWithFrame:(CGRect)frame
{
    if (self = [super initWithFrame:frame]) {
        [self setup];
    }
    
    return self;
}

- (void)setup
{
    _waves = [NSMutableArray new];
    
    _frequency = 1.2f;
    
    _amplitude = 1.0f;
    _idleAmplitude = 0.01f;
    
    _numberOfWaves = 5;
    _phaseShift = -0.25f;
    _density = 1.f;
    
    _waveColor = [UIColor blueColor];
    _mainWaveWidth = 2.0f;
    _decorativeWavesWidth = 1.0f;
    
    _waveHeight = CGRectGetHeight(self.bounds);
    _waveWidth  = CGRectGetWidth(self.bounds);
    _waveMid    = _waveWidth / 2.0f;
    _maxAmplitude = _waveHeight - 4.0f;
    
    for (int i = 0; i < _numberOfWaves; i++) {
        CAShapeLayer *waveline = [CAShapeLayer layer];
        waveline.lineCap       = kCALineCapButt;
        waveline.lineJoin      = kCALineJoinRound;
        waveline.strokeColor   = [[UIColor blueColor] CGColor];
        waveline.fillColor     = [[UIColor clearColor] CGColor];
        [waveline setLineWidth:(i==0 ? _mainWaveWidth : _decorativeWavesWidth)];
        CGFloat progress = 1.0f - (CGFloat)i / _numberOfWaves;
        CGFloat multiplier = MIN(1.0, (progress / 3.0f * 2.0f) + (1.0f / 3.0f));
        UIColor *color = [_waveColor colorWithAlphaComponent:(i == 0 ? 1.0 : 1.0 * multiplier * 0.4)];
        waveline.strokeColor = color.CGColor;
        [self.layer addSublayer:waveline];
        [_waves addObject:waveline];
    }
}

- (void)setupDisplayLink
{
    [_displayLink invalidate];
    _displayLink = [CADisplayLink displayLinkWithTarget:self selector:@selector(invokeWaveCallback)];
    [_displayLink addToRunLoop:[NSRunLoop currentRunLoop] forMode:NSRunLoopCommonModes];
}

- (void)setWaverLevelCallback:(void (^)(QDWaveView * waver))waverLevelCallback
{
    _waverLevelCallback = waverLevelCallback;
}

- (void)invokeWaveCallback
{
    _waverLevelCallback(self);
}

- (void)setLevel:(CGFloat)level
{
    _level = level;
    
    _phase += _phaseShift; // Move the wave
    
    _amplitude = fmax( level, _idleAmplitude);
    [self updateMeters];
}


- (void)updateMeters
{
    _waveHeight = CGRectGetHeight(self.bounds);
    _waveWidth  = CGRectGetWidth(self.bounds);
    _waveMid    = _waveWidth / 2.0f;
    _maxAmplitude = _waveHeight - 4.0f;
    
//    UIGraphicsBeginImageContext(self.frame.size);
    
    for(int i = 0; i < _numberOfWaves; i++) {
        
        UIBezierPath *wavelinePath = [UIBezierPath bezierPath];
        
        // Progress is a value between 1.0 and -0.5, determined by the current wave idx, which is used to alter the wave's amplitude.
        CGFloat progress = 1.0f - (CGFloat)i / _numberOfWaves;
        CGFloat normedAmplitude = (1.5f * progress - 0.5f) * _amplitude;
        
        
        for(CGFloat x = 0; x < _waveWidth + _density; x += _density) {
            
            //Thanks to https://github.com/stefanceriu/SCSiriWaveformView
            // We use a parable to scale the sinus wave, that has its peak in the middle of the view.
            CGFloat scaling = -pow(x / _waveMid  - 1, 2) + 1; // make center bigger
            
            CGFloat y = scaling * _maxAmplitude * normedAmplitude * sinf(2 * M_PI *(x / _waveWidth) * _frequency + _phase) + (_waveHeight * 0.5);
            
            if (x==0) {
                [wavelinePath moveToPoint:CGPointMake(x, y)];
            }
            else {
                [wavelinePath addLineToPoint:CGPointMake(x, y)];
            }
        }
        
        CAShapeLayer *waveline = [_waves objectAtIndex:i];
        waveline.path = [wavelinePath CGPath];
    }
    
//    UIGraphicsEndImageContext();
}

- (void)startAnimation
{
    if (!_displayLink) {
        [self setupDisplayLink];
    }
    _displayLink.paused = NO;
    self.hidden = NO;
}

- (void)stopAnimation
{
    self.hidden = YES;
    _displayLink.paused = YES;
    [_displayLink invalidate];
    _displayLink = nil;
}
@end

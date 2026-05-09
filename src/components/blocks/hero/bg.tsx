/**
 * ShipAny 风格动态渐变背景
 */
export default function Bg() {
  return (
    <>
      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(50px, -60px) scale(1.2);
          }
          50% {
            transform: translate(-60px, 50px) scale(0.8);
          }
          75% {
            transform: translate(60px, 60px) scale(1.1);
          }
        }
      `}</style>
      
      <div className="pointer-events-none absolute inset-0 -z-50 overflow-hidden">
        {/* 背景基底 */}
        <div className="absolute inset-0 bg-background" />
        
        {/* 动态渐变光球 - 涂鸦风格配色 */}
        <div 
          className="absolute left-[10%] top-[20%] h-[500px] w-[500px] rounded-full bg-red-500/30 opacity-70 blur-3xl" 
          style={{
            animation: 'blob 7s ease-in-out infinite',
          }}
        />
        
        <div 
          className="absolute right-[10%] top-[10%] h-[400px] w-[400px] rounded-full bg-yellow-500/30 opacity-70 blur-3xl"
          style={{
            animation: 'blob 7s ease-in-out infinite 2s',
          }}
        />
        
        <div 
          className="absolute bottom-[10%] left-[30%] h-[450px] w-[450px] rounded-full bg-green-500/30 opacity-70 blur-3xl"
          style={{
            animation: 'blob 7s ease-in-out infinite 4s',
          }}
        />
        
        <div 
          className="absolute bottom-[20%] right-[20%] h-[400px] w-[400px] rounded-full bg-cyan-500/30 opacity-70 blur-3xl"
          style={{
            animation: 'blob 7s ease-in-out infinite 1s',
          }}
        />
        
        {/* 顶部遮罩（渐变淡出） */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-background" />
      </div>
    </>
  );
}
import React, { useRef, useState, useEffect } from 'react';
import SoundPatternBuilder from './SoundPatternBuilder';

function App() {
  const imgRef = useRef(null);
  const [followMouse, setFollowMouse] = useState(false);
  const [bouncing, setBouncing] = useState(false);

  const [style, setStyle] = useState({
    position: 'absolute',
    top: '50%',
    left: '50%',
    width: '50%',
    height: 'auto',
    transform: 'translateY(0)',
    transition: 'none',
  });

  // 마우스 따라 움직이기
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!followMouse || !imgRef.current) return;

      setStyle((prev) => ({
        ...prev,
        left: `${e.clientX - imgRef.current.offsetWidth / 2}px`,
        top: `${e.clientY - imgRef.current.offsetHeight / 2}px`,
        transition: 'none',
      }));
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [followMouse]);

  // 클릭 시 낙하 + 튕기기
  const handleClick = () => {
    if (!followMouse) return;

    setFollowMouse(false);
    setStyle((prev) => ({
      ...prev,
      top: '60%',
      transition: 'top 0.3s ease-in',
    }));

    setTimeout(() => {
      setBouncing(true);
    }, 300);
  };

  return (
    <div className="container" style={{ position: 'relative' }}>
      {/* 첫 번째 화면 */}
      <section className="section" id="section1" style={{ position: 'relative', height: '100vh' }}>
        <div className="content">
          <img
            ref={imgRef}
            src="/img/Harmony.png"
            alt="Harmony"
            onMouseEnter={() => setFollowMouse(true)}
            onClick={handleClick}
            style={{
              ...style,
              animation: bouncing ? 'bounceHard 0.8s ease-out' : 'none',
              cursor: followMouse ? 'pointer' : 'default',
            }}
            onAnimationEnd={() => setBouncing(false)}
          />
          <p className="ex1">도형을 통해 나만의 음악을 만들 수 있는 AI 작곡 도구입니다.</p>
          <p className="ex2">글자에 마우스를 올려보세요.</p>
        </div>
      </section>

      {/* 두 번째 화면 */}
      <section className="section" id="section2">
        <div className="content">
          <h2>시각적 작곡</h2>
          <p className="ex1">Harmony는 도형 기반 인터페이스를 통해 누구나 쉽게 리듬과 패턴을 만들어 음악을 완성할 수 있어요.</p>
        </div>
      </section>

      {/* 세 번째 화면 */}
      <section className="section" id="section3">
        <div className="content">
          <h2>Sound Pattern Builder</h2>
          <SoundPatternBuilder />
        </div>
      </section>

      {/* 네 번째 화면 */}
      <section className="section" id="section4">
        <div className="content">
          <h2>Anthony Braxton</h2>
        </div>
      </section>
    </div>
  );
}

export default App;

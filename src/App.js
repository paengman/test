import React, { useEffect, useRef, useState } from 'react';
import SoundPatternBuilder from './SoundPatternBuilder';
import MatterScene from './components/MatterScene';
import GallerySection from './components/GallerySection';
import ComposeSlideSection from './components/ComposeSlideSection';
import LastSection from "./components/LastSection";

function App() {
  const audioRef = useRef(null);
  const matterRef = useRef(null);
  const soundRef = useRef(null);
  const slideRef = useRef(null);

  const [isMatterVisible, setIsMatterVisible] = useState(false);
  const [isSoundVisible, setIsSoundVisible] = useState(false);
  const [isSlideVisible, setIsSlideVisible] = useState(false);

  // 공통 오디오 효과
  useEffect(() => {
    audioRef.current = new Audio("/sound/for_site/typewriter.mp3");
    audioRef.current.volume = 0.5;

    const playSound = () => {
      if (!audioRef.current) return;
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch((e) => console.error("오디오 재생 실패:", e));
    };

    const handleWheel = () => playSound();
    const handleClick = () => playSound();

    window.addEventListener("wheel", handleWheel);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("click", handleClick);
    };
  }, []);

  // IntersectionObserver로 섹션 감지
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsMatterVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (matterRef.current) observer.observe(matterRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsSoundVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (soundRef.current) observer.observe(soundRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
  const observer = new IntersectionObserver(
    ([entry]) => setIsSlideVisible(entry.isIntersecting),
    { threshold: 0.1 }
  );
  if (slideRef.current) observer.observe(slideRef.current);
  return () => observer.disconnect();
}, []);

  return (
    <div className="container">
      <nav className="navbar">
        <ul>
          <li><a href="#section1">Home</a></li>
          <li><a href="#section3">Composite</a></li>
          <li><a href="#section4">Gallery</a></li>
          <li><a href="#section5">Anthony Braxton</a></li>
        </ul>
      </nav>

      {/* 첫 번째 화면 */}
      <section
        className="section"
        id="section1"
        style={{
          position: 'relative',
          height: '100vh',
          overflow: 'hidden',
        }}
        ref={matterRef}
      >
        <MatterScene isVisible={isMatterVisible} />

        <h1
          style={{
            position: 'absolute',
            top: '5vh',
            left: 0,
            width: '100%',
            height: '40vh',
            overflow: 'hidden',
            margin: 0,
            padding: 0,
            zIndex: 2,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <div className="marquee">
            <div className="marquee-content">
              {[...Array(10)].map((_, idx) => (
                <span key={idx} style={{ display: 'inline-block', marginRight: '0vw' }}>
                  <span style={{ color: '#FE6E3D', fontFamily: 'Loos ExtraWide', fontWeight: 400 }}>H</span>
                  <span style={{ color: '#000000', fontFamily: 'Loos Extended', fontWeight: 400 }}>a</span>
                  <span style={{ color: '#6EC1A1', fontFamily: 'Loos ExtraWide', fontWeight: 500 }}>r</span>
                  <span style={{ color: '#F5BC62', fontFamily: 'Loos ExtraWide', fontWeight: 300 }}>m</span>
                  <span style={{ color: '#4284F3', fontFamily: 'Loos ExtraWide', fontWeight: 700 }}>o</span>
                  <span style={{ color: '#000000', fontFamily: 'Loos ExtraWide', fontWeight: 300 }}>n</span>
                  <span style={{ color: '#EF7A88', fontFamily: 'Loos ExtraWide', fontWeight: 500 }}>y</span>
                </span>
              ))}
            </div>
          </div>
        </h1>
      </section>

    {/* 두 번째 화면 */}
<section
  id="section2"
  ref={slideRef}
  style={{
    backgroundColor: "#4285f4",
  }}
>
  <div>
    <ComposeSlideSection isVisible={isSlideVisible} />
  </div>
</section>


      {/* 세 번째 화면 */}
      <section className="section" id="section3" ref={soundRef}>
        <div className="content">
          <SoundPatternBuilder isVisible={isSoundVisible} />
        </div>
      </section>

      {/* 네 번째 화면 */}
      <section
  className="section"
  id="section4"
  style={{
    height: '100vh',
    overflowY: 'auto',
    paddingTop: '40%', // 헤더 높이만큼 조절 (필요에 따라 더 늘려도 돼)
    backgroundColor: "#6EC1A1",
  }}
>
  <div className="content">
    <GallerySection />
  </div>
</section>

      {/* 다섯 번째 화면 */}
      <section className="section" id="section5"
       style={{
    backgroundColor: "#F7F2EA",
    height: "100vh",
    width: "100vw",     // ✨ 전체 너비 확보
    margin: 0,           // ✨ 여백 제거
    padding: 0,          // ✨ 여백 제거
    overflow: "hidden",  // ✨ 내부 넘침 방지
  }} >
        <div className="content">
          <LastSection /> {/* ✅ 이 부분만 추가해주면 돼 */}
        </div>
      </section>
    </div>
  );
}

export default App;

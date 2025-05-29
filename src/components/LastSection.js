import React from "react";

function LastSection() {
  return (
    <section style={styles.section}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1920 900"
        preserveAspectRatio="xMidYMid meet"
        style={styles.svg}
      >
        {/* 큰 원 */}
        <circle cx="900" cy="450" r="350" fill="#FE6E3D" />

        {/* 오른쪽쪽 원 */}
        <circle cx="1300" cy="250" r="250" fill="#F7F2EA" />

        {/* 오른쪽 원 기준 텍스트 경로 */}
        <path
          id="textCirclePath"
          d="M 1100,250 a 200,200 0 1,1 399,0 a 200,200 0 1,1 -399,0"
          fill="none"
        />

        <text
          fontSize="22"
          fill="#FE6E3D"
          fontFamily="Loos Extended"
          letterSpacing="1"
        >
          <textPath href="#textCirclePath" startOffset="50%" textAnchor="middle">
            소리를 그리는 작곡가 Anthony Braxton은 다양한 소리를 시각적 도형으로 분류해, 실험적이고 논리적인 방식으로 작곡했습니다. 그의 방식처럼, 소리를 직관적으로 다룰 수 있는 창의적인 인터페이스를 개발하고자 했습니다. 이 프로젝트는 Anthony Braxton의 음악 기호화 체계에서 영감을 받았습니다.
          </textPath>
        </text>

        {/* 왼쪽 상단 점 두 개 */}
        <circle cx="50" cy="80" r="14" fill="#FE6E3D" />
        <circle cx="50" cy="130" r="14" fill="#FE6E3D" />

        {/* 왼쪽 하단 직선 하나 */}
        <rect x="40" y="800" width="14" height="60" fill="#FE6E3D" />
      </svg>

      {/* 회전 이미지 */}
      <img
        src="/img/ab.png"
        alt="Anthony Braxton"
        style={{
          position: "absolute",
          top: "350px",
          left: "200px",
          width: "400px",
          animation: "spin 10s linear infinite", // 🔄 애니메이션
          transformOrigin: "center center",
        }}
      />

      {/* 인라인 키프레임 정의 */}
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
    </section>
  );
}

const styles = {
  section: {
    width: "100vw",
    height: "100vh",
    overflow: "hidden",
    position: "relative",
    padding: 0,
    margin: 0,
  },
  svg: {
    display: "block",
    position: "absolute",
    top: 0,
    left: 0,
  },
};

export default LastSection;

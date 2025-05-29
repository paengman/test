import React from "react";

function ComposeSlideSection() {
  return (
    <section style={styles.section}>
      <div style={styles.ellipse}>
        <svg
          viewBox="0 0 1650 950"
          width="100%"
          height="100%"
          style={{ position: "absolute", top: 0, left: 0 }}
        >
          {/* 배경 타원 */}
          <ellipse
            cx="825"
            cy="475"
            rx="800"
            ry="380"
            fill="#f7f2ea"
          />

          {/* 텍스트 기준 경로 (조금 작아진 타원 경로) */}
          <path
            id="grayEllipsePath"
            d="
              M 75,475
              A 750,356 0 1,1 1575,475
              A 750,356 0 1,1 75,475
            "
            fill="none"
          />

          {/* 텍스트 */}
          <text
            fill="#333"
            fontSize="28"
            fontFamily="Loos Extended"
            fontWeight="400"
            letterSpacing="2"
          >
            <textPath
              href="#grayEllipsePath"
              startOffset="50%"
              textAnchor="middle"
              dominantBaseline="hanging"
            >
              <tspan>
                <tspan fill="#F5BC62">Harmony</tspan>는 <tspan fill="#F5BC62">ElevenLabs</tspan>로 생성한 효과음을 시각적 기호로 정리해, 사용자가 <tspan fill="#F5BC62">기호만으로 직관적이고 창의적으로 작곡</tspan>할 수 있는 인터페이스를 제공합니다.
              </tspan>
              <tspan dx="80">
                <tspan fill="#F5BC62">Elevenlabs</tspan>는 AI 기반 Text to Speech 도구로 <tspan fill="#F5BC62">원하는 효과음과 음성을 생성</tspan>할 수 있습니다.
              </tspan>
            </textPath>
          </text>

        </svg>
      </div>
    </section>
  );
}

const styles = {
  section: {
    height: "100vh",
    width: "100vw",
    backgroundColor: "#4285f4",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    scrollSnapAlign: "start",
  },
  ellipse: {
    width: "165vw",
    height: "95vw",
    maxWidth: "1650px",
    maxHeight: "950px",
    backgroundColor: "transparent",
    position: "relative",
  },
};

export default ComposeSlideSection;

// src/components/ComposeSlideSection.js
import SoundPatternBuilder from "../SoundPatternBuilder";

function ComposeSlideSection() {
  return (
    <section className="h-screen snap-start overflow-x-scroll scroll-smooth">
      <div className="flex w-[200vw] h-full snap-x snap-mandatory">
        {/* 왼쪽: 설명 */}
        <div className="w-screen flex items-center justify-center bg-blue-50 snap-start px-8">
          <div className="max-w-xl text-left">
            <h2 className="text-4xl font-bold mb-4">🎼 시각적 작곡</h2>
            <p className="text-lg text-gray-700 leading-relaxed">
              Harmony는 도형 기반의 인터페이스를 통해 누구나 쉽게 음악을 구성할 수 있습니다.
              강박, 중박, 약박 도형을 조합해 나만의 패턴을 만들어보세요.
            </p>
            <p className="mt-4 text-gray-400">→ 오른쪽으로 스크롤해보세요</p>
          </div>
        </div>

        {/* 오른쪽: 작곡 화면 */}
        <div className="w-screen bg-gray-100 snap-start">
          <SoundPatternBuilder />
        </div>
      </div>
    </section>
  );
}

export default ComposeSlideSection;

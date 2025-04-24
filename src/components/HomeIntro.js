// src/components/HomeIntro.js
function HomeIntro() {
    return (
      <section className="h-screen snap-start flex items-center justify-center bg-white px-6">
        <div className="text-center max-w-2xl">
          <h1 className="text-5xl font-bold mb-6 text-gray-800">
            🎵 Harmony: 조형으로 만드는 AI 작곡
          </h1>
          <p className="text-lg text-gray-600 leading-relaxed">
            Harmony는 도형을 통해 소리를 만들고, 박자와 길이, 강세를 시각적으로 조합하여
            나만의 음악을 완성할 수 있는 AI 작곡 도구입니다.  
            다양한 소리를 조합하고, 직접 그린 음악을 저장해보세요!
          </p>
          <p className="mt-10 text-gray-400 animate-bounce">↓ 아래로 스크롤해서 시작하기</p>
        </div>
      </section>
    );
  }
  
  export default HomeIntro;
  
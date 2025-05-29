import React, { useEffect, useState, useRef } from 'react';
import './GallerySection.css';

const dummyItems = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  image: `/img/image 69.png`,
  composer: `작곡가 ${i + 1}`,
  likes: 0,
  comments: [],
}));

const GallerySection = () => {
  const [galleryItems, setGalleryItems] = useState(dummyItems);
  const [sort, setSort] = useState("latest");
  const visibleRefs = useRef([]);
  const [visibleIds, setVisibleIds] = useState([]);
  const [clickedId, setClickedId] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const id = entry.target.dataset.id;
            setVisibleIds(prev =>
              prev.includes(id) ? prev : [...prev, id]
            );
          }
        });
      },
      { threshold: 0.2 }
    );

    visibleRefs.current.forEach(ref => {
      if (ref) observer.observe(ref);
    });

    return () => {
      visibleRefs.current.forEach(ref => {
        if (ref) observer.unobserve(ref);
      });
    };
  }, [galleryItems]);

  const sortedItems = [...galleryItems].sort((a, b) => {
    if (sort === "popular") return b.likes - a.likes;
    return b.id - a.id;
  });

  const handleLike = (id) => {
    setGalleryItems(prev =>
      prev.map(item =>
        item.id === id ? { ...item, likes: item.likes + 1 } : item
      )
    );
    setClickedId(id); // 하트 클릭 상태 저장

    setTimeout(() => {
      setClickedId(null); // 1초 후 원래 색으로 복귀
    }, 1000);
  };

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div className="sort-buttons">
          <button
            className={`sort-button ${sort === "latest" ? "active" : ""}`}
            onClick={() => setSort("latest")}
          >
            최신순
          </button>
          <button
            className={`sort-button ${sort === "popular" ? "active" : ""}`}
            onClick={() => setSort("popular")}
          >
            인기순
          </button>
        </div>
      </div>

      <div className="gallery-grid">
        {sortedItems.map((item, index) => (
          <div
            key={item.id}
            data-id={item.id}
            ref={(el) => (visibleRefs.current[index] = el)}
            className={`gallery-card ${visibleIds.includes(String(item.id)) ? "visible" : ""}`}
            style={{
              transitionDelay: `${index * 100}ms`,
            }}
            onClick={() => console.log("재생용 도형 데이터:", item.shapeData)}
          >
            <img src={item.image} alt="악보" />
            <div className="card-footer">
              <strong>{item.composer}</strong>
              <button
                className={`like-button ${clickedId === item.id ? "liked" : ""}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handleLike(item.id);
                }}
              >
                ♡ {item.likes}
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default GallerySection;

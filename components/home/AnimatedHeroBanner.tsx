'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

const AnimatedHeroBanner: React.FC = () => {
  const [currentText, setCurrentText] = useState('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const texts = ['champions.', 'players.', 'athletes.'];

  useEffect(() => {
    const typeSpeed = isDeleting ? 40 : 100;
    const currentFullText = texts[currentIndex];
    
    const timer = setTimeout(() => {
      if (!isDeleting) {
        if (currentText.length < currentFullText.length) {
          setCurrentText(currentFullText.substring(0, currentText.length + 1));
        } else {
          setTimeout(() => setIsDeleting(true), 1500);
        }
      } else {
        if (currentText.length > 0) {
          setCurrentText(currentText.substring(0, currentText.length - 1));
        } else {
          setIsDeleting(false);
          setCurrentIndex((prevIndex) => (prevIndex + 1) % texts.length);
        }
      }
    }, typeSpeed);

    return () => clearTimeout(timer);
  }, [currentText, currentIndex, isDeleting, texts]);

  return (
    <>
      <style>{`
        @font-face {
          font-family: "monument_extendedregular";
          src: url("https://www.yudiz.com/codepen/photography-banner/monumentextended-regular.woff2") format("woff2");
          font-weight: normal;
          font-style: normal;
        }

        @font-face {
          font-family: "Extenda Trial 30 Deca";
          src: url("https://www.yudiz.com/codepen/photography-banner/Extenda-30Deca.woff2") format("woff2");
          font-weight: normal;
          font-style: normal;
          font-display: swap;
        }

        @font-face {
          font-family: "Extenda Trial 20 Micro";
          src: url("https://www.yudiz.com/codepen/photography-banner/Extenda-20Micro.woff2") format("woff2");
          font-weight: 300;
          font-style: normal;
          font-display: swap;
        }

        .sprint-banner,
        .sprint-banner * {
          box-sizing: border-box;
        }
        
        .sprint-banner {
          margin: 0;
          background: linear-gradient(135deg, #E8F5E9 0%, #F3E5F5 50%, #FFF3E0 100%);
          overflow-x: hidden;
          width: 100%;
          position: relative;
        }
        
        .sprint-banner::before {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-image: url("/courts/WhatsApp Image 2026-01-18 at 05.42.48.jpeg");
          background-size: cover;
          background-position: center center;
          background-repeat: no-repeat;
          background-attachment: fixed;
          z-index: 0;
        }
        
        .sprint-banner::after {
          content: "";
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 40%, rgba(0, 0, 0, 0.35) 100%);
          z-index: 1;
        }
        
        @media (max-width: 768px) {
          .sprint-banner::before {
            background-attachment: scroll;
          }
        }

        .sprint-banner *::selection {
          background-color: rgba(214, 247, 76, 0.3);
          color: #1a1a1a;
        }

        .info-section {
          min-height: 70vh;
          max-height: 700px;
          padding: 100px 30px 60px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          z-index: 2;
          user-select: none;
          overflow: hidden;
        }

        .info-section::before {
          content: "";
          border-radius: 197.5px 0px;
          opacity: 0.4;
          background: #D6F74C;
          filter: blur(120px);
          height: 50%;
          width: 40%;
          position: absolute;
          top: -20%;
          left: -20%;
          z-index: -1;
        }

        .info-section::after {
          content: "";
          border-radius: 197.5px 0px;
          opacity: 0.3;
          background: #F06038;
          filter: blur(100px);
          height: 40%;
          width: 30%;
          position: absolute;
          bottom: -10%;
          right: -10%;
          z-index: -1;
        }

        .left-part {
          padding: 0;
          overflow: hidden;
          flex: 1;
        }

        .left-part h1 {
          margin: 0;
          color: #ffffff;
          font-family: "Extenda Trial 30 Deca";
          font-size: clamp(60px, 12vw, 160px);
          line-height: 0.85;
          font-weight: normal;
          text-transform: uppercase;
        }

        .left-part h1 .text {
          color: #F06038;
          display: block;
          height: 120px;
        }

        .left-part h1 .d-flex {
          display: flex;
          align-items: center;
        }

        .left-part h1 .char {
          transform: translateY(0);
          transition: transform 0.5s;
          animation: slideUp 0.3s ease-out forwards;
        }

        @keyframes slideUp {
          from { transform: translateY(-300px); }
          to { transform: translateY(0); }
        }

        .left-part p {
          width: 80%;
          margin: 20px 0 0;
          color: #ffffff;
          font-size: 15px;
          line-height: 1.8;
          font-family: "monument_extendedregular";
        }

        .book-link {
          margin: 30px 0 0;
          padding: 0;
          border: 0;
          font-size: 36px;
          line-height: 1;
          color: #ffffff;
          letter-spacing: 0.25px;
          text-transform: uppercase;
          font-family: "Extenda Trial 20 Micro";
          font-weight: 300;
          display: inline-flex;
          align-items: center;
          gap: 20px;
          position: relative;
          text-decoration: none;
          cursor: pointer;
        }

        .book-link .linktext {
          position: relative;
          overflow: hidden;
          display: inline-block;
        }

        .book-link .linktext::before {
          position: absolute;
          content: "";
          left: 0;
          bottom: 4px;
          width: 100%;
          height: 2px;
          background-color: #1a1a1a;
          transform: scaleX(1);
          transition: transform 250ms ease-in-out;
          transform-origin: 0 0;
        }

        .book-link:hover .linktext:before {
          transform: scaleX(0);
          transform-origin: 100% 100%;
        }

        .book-link .arrow {
          height: 26px;
          width: 26px;
          top: -3px;
          display: inline-block;
          position: relative;
          overflow: hidden;
        }

        .book-link .arrow::before,
        .book-link .arrow::after {
          position: absolute;
          content: "";
          background-color: #F06038;
          transition: all ease-in-out 0.35s;
          transform-origin: 0 0;
          border-radius: 30px;
        }

        .book-link .arrow::before {
          height: 2px;
          width: 100%;
          top: 0;
          right: 0;
        }

        .book-link .arrow::after {
          width: 2px;
          height: 100%;
          top: 0;
          right: 0;
        }

        .book-link:hover .arrow::before { width: 65%; }
        .book-link:hover .arrow::after { height: 65%; }

        .book-link .arrow span {
          background-color: #F06038;
          height: 2px;
          width: 100%;
          display: inline-block;
          transform: rotate(-45deg) translate(-3px, -1px);
          transform-origin: right top;
          border-radius: 30px;
          position: absolute;
          top: 0;
          left: 0;
          transition: all ease-in-out 0.35s;
        }

        .book-link .arrow span::before {
          background-color: #F06038;
          content: "";
          height: 100%;
          width: 15px;
          left: -15px;
          top: 0;
          position: absolute;
        }

        .right-part {
          background-color: transparent;
          height: 380px;
          width: 380px;
          margin: 0;
          display: block;
          position: relative;
          z-index: 1;
          flex-shrink: 0;
        }

        .right-part::before {
          content: "";
          border-radius: 197.5px 0px;
          opacity: 0.4;
          background: #8C9EFF;
          filter: blur(80px);
          height: 50%;
          width: 60%;
          position: absolute;
          top: 50%;
          right: 20%;
          transform: translate(50%, -50%);
          z-index: -1;
        }

        .right-part .d-flex {
          height: 100%;
          gap: 14px;
          display: flex;
          flex-wrap: wrap;
          align-content: space-between;
          position: relative;
        }

        .main-grid {
          position: relative;
        }

        .box {
          width: calc((100% / 3) - 10px);
          height: calc((100% / 3) - 10px);
          background-color: rgba(255,255,255,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(0,0,0,0.08);
          font-size: 12px;
          font-weight: 600;
          line-height: 1.3;
          color: #1a1a1a;
          font-family: "monument_extendedregular";
          border-radius: 80px;
          position: absolute;
          animation: 30s infinite;
          text-align: center;
          padding: 8px;
          backdrop-filter: blur(10px);
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }

        .box:nth-child(1) { left: 0; top: 0; animation-name: box-1; }
        .box:nth-child(2) { left: calc(100% / 3); top: 0; animation-name: box-2; }
        .box:nth-child(3) { left: calc((100% / 3) * 2); top: 0; animation-name: box-3; }
        .box:nth-child(4) { left: 0; top: calc(100% / 3); animation-name: box-4; }
        .box:nth-child(5) { left: calc((100% / 3) * 2); top: calc(100% / 3); animation-name: box-5; }
        .box:nth-child(6) { left: 0; top: calc((100% / 3) * 2); animation-name: box-6; }
        .box:nth-child(7) { left: calc(100% / 3); top: calc((100% / 3) * 2); animation-name: box-7; }
        .box:nth-child(8) { left: calc((100% / 3) * 2); top: calc((100% / 3) * 2); animation-name: box-8; }

        @keyframes box-1 {
          0%, 90%, 100% { left: 0; top: 0; }
          2.5%, 12.5% { left: calc(100% / 3); }
          15%, 25% { left: calc((100% / 3) * 2); top: 0; }
          27.5% { left: calc((100% / 3) * 2); top: calc(100% / 3); }
          40%, 50% { left: calc((100% / 3) * 2); top: calc((100% / 3) * 2); }
          52.5%, 62.5% { left: calc(100% / 3); }
          65%, 75% { left: 0; top: calc((100% / 3) * 2); }
          77.5%, 87.5% { top: calc(100% / 3); }
        }

        @keyframes box-2 {
          0%, 90%, 100% { left: calc(100% / 3); }
          2.5%, 12.5% { left: calc((100% / 3) * 2); top: 0; }
          27.5%, 37.5% { left: calc((100% / 3) * 2); top: calc((100% / 3) * 2); }
          40%, 50% { left: calc(100% / 3); top: calc((100% / 3) * 2); }
          52.5%, 62.5% { left: 0; top: calc((100% / 3) * 2); }
          65%, 75% { left: 0; top: calc(100% / 3); }
          77.5%, 87.5% { left: 0; top: 0; }
        }

        @keyframes box-3 {
          0%, 90%, 100% { left: calc((100% / 3) * 2); }
          15%, 25% { left: calc((100% / 3) * 2); top: calc((100% / 3) * 2); }
          27.5%, 37.5% { left: calc(100% / 3); top: calc((100% / 3) * 2); }
          40%, 50% { left: 0; top: calc((100% / 3) * 2); }
          52.5%, 62.5% { left: 0; top: calc(100% / 3); }
          65%, 75% { left: 0; top: 0; }
          77.5%, 87.5% { left: calc(100% / 3); top: 0; }
        }

        @keyframes box-4 {
          0%, 90%, 100% { top: calc(100% / 3); }
          2.5%, 12.5% { left: 0; top: 0; }
          15%, 25% { left: calc(100% / 3); top: 0; }
          27.5%, 37.5% { left: calc((100% / 3) * 2); top: 0; }
          52.5%, 62.5% { left: calc((100% / 3) * 2); top: calc((100% / 3) * 2); }
          65%, 75% { left: calc(100% / 3); top: calc((100% / 3) * 2); }
          77.5%, 87.5% { left: 0; top: calc((100% / 3) * 2); }
        }

        @keyframes box-5 {
          0%, 90%, 100% { left: calc((100% / 3) * 2); top: calc(100% / 3); }
          2.5%, 12.5% { left: calc((100% / 3) * 2); top: calc((100% / 3) * 2); }
          15%, 25% { left: calc(100% / 3); top: calc((100% / 3) * 2); }
          27.5%, 37.5% { left: 0; top: calc((100% / 3) * 2); }
          40%, 50% { left: 0; top: calc(100% / 3); }
          52.5%, 62.5% { left: 0; top: 0; }
          65%, 75% { left: calc(100% / 3); top: 0; }
          77.5%, 87.5% { left: calc((100% / 3) * 2); top: 0; }
        }

        @keyframes box-6 {
          0%, 90%, 100% { left: 0; top: calc((100% / 3) * 2); }
          2.5%, 12.5% { left: 0; top: calc(100% / 3); }
          15%, 25% { left: 0; top: 0; }
          27.5%, 37.5% { left: calc(100% / 3); top: 0; }
          40%, 50% { left: calc((100% / 3) * 2); top: 0; }
          65%, 75% { left: calc((100% / 3) * 2); top: calc((100% / 3) * 2); }
        }

        @keyframes box-7 {
          0%, 90%, 100% { left: calc(100% / 3); top: calc((100% / 3) * 2); }
          2.5%, 12.5% { left: 0; top: calc((100% / 3) * 2); }
          15%, 25% { left: 0; top: calc(100% / 3); }
          27.5%, 37.5% { left: 0; top: 0; }
          40%, 50% { left: calc(100% / 3); top: 0; }
          52.5%, 62.5% { left: calc((100% / 3) * 2); top: 0; }
        }

        @keyframes box-8 {
          0%, 90%, 100% { left: calc((100% / 3) * 2); top: calc((100% / 3) * 2); }
          2.5%, 12.5% { left: calc(100% / 3); top: calc((100% / 3) * 2); }
          15%, 25% { left: 0; top: calc((100% / 3) * 2); }
          27.5%, 37.5% { left: calc(100% / 3); top: calc(100% / 3); }
          40%, 50% { left: 0; top: 0; }
          52.5%, 62.5% { left: calc(100% / 3); top: 0; }
          65%, 75% { left: calc((100% / 3) * 2); top: 0; }
        }

        .box .bg-img {
          position: absolute;
          top: 0;
          left: 0;
          border-radius: 80px;
          overflow: hidden;
          height: 100%;
          width: 100%;
        }

        .box .bg-img img {
          height: 100%;
          width: 100%;
          object-fit: cover;
          object-position: center center;
        }

        /* Stats Bar */
        .stats-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 30px;
          margin-top: 30px;
          text-align: center;
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-family: "Extenda Trial 30 Deca";
          font-size: 36px;
          color: #D6F74C;
          line-height: 1;
        }

        .stat-label {
          font-family: "monument_extendedregular";
          font-size: 11px;
          color: #ffffff;
          text-transform: uppercase;
          margin-top: 4px;
        }

        /* Responsive */
        @media screen and (min-width: 1400px) {
          .info-section { padding-left: 80px; padding-right: 80px; }
        }

        @media screen and (max-width: 1199px) {
          .right-part { height: 320px; width: 320px; }
          .right-part .d-flex { gap: 12px; }
          .box { font-size: 10px; }
          .left-part p { font-size: 13px; width: 90%; }
          .left-part h1 .text { height: 100px; }
          .book-link { font-size: 30px; gap: 16px; }
          .book-link .arrow { height: 22px; width: 22px; }
          .stat-number { font-size: 30px; }
          .stats-bar { gap: 24px; }
        }

        @media screen and (max-width: 991px) {
          .info-section { 
            flex-direction: column; 
            padding: 100px 20px 40px;
            min-height: auto;
            max-height: none;
          }
          .left-part { text-align: center; }
          .left-part h1 .d-flex { justify-content: center; }
          .left-part p { width: 100%; margin: 15px auto 0; }
          .stats-bar { justify-content: center; margin-top: 25px; }
          .right-part { margin-top: 40px; }
        }

        @media screen and (max-width: 767px) {
          .info-section { padding: 90px 16px 30px; }
          .right-part { height: 280px; width: 280px; }
          .left-part h1 .text { height: 70px; }
          .left-part p { font-size: 12px; }
          .box { font-size: 9px; }
          .book-link { font-size: 24px; gap: 12px; margin-top: 20px; }
          .book-link .arrow { height: 18px; width: 18px; }
          .stat-number { font-size: 24px; }
          .stats-bar { gap: 18px; margin-top: 20px; }
          .stat-label { font-size: 9px; }
        }

        @media screen and (max-width: 480px) {
          .right-part { height: 240px; width: 240px; }
          .box { font-size: 8px; padding: 6px; }
        }
      `}</style>
      
      <div className="sprint-banner">
        <main>
          <section className="info-section">
            <div className="left-part">
              <h1>
                <span className="d-flex">
                  {['w', 'e', ' ', 'b', 'u', 'i', 'l', 'd'].map((char, index) => (
                    <span key={index} className="char" style={{ animationDelay: `${index * 0.08}s` }}>
                      {char === ' ' ? '\u00A0' : char}
                    </span>
                  ))}
                </span>
                <span className="text">{currentText}</span>
              </h1>
              <p>Book premium sports courts across Klang Valley. Pickleball, Padel, Tennis, and more — all in one place.</p>
              
              <Link href="/venues" className="book-link">
                <span className="linktext">Explore Courts</span>
                <span className="arrow">
                  <span></span>
                </span>
              </Link>

              <div className="stats-bar">
                <div className="stat-item">
                  <div className="stat-number">50+</div>
                  <div className="stat-label">Venues</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">200+</div>
                  <div className="stat-label">Courts</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Bookings</div>
                </div>
              </div>
            </div>

            <div className="right-part">
              <div className="main-grid d-flex">
                <div className="box">Pickleball</div>
                <div className="box">
                  <div className="bg-img">
                    <img src="/courts/pickleball.jpg" alt="Pickleball" />
                  </div>
                </div>
                <div className="box">Padel</div>
                <div className="box">Tennis</div>
                <div className="box">
                  <div className="bg-img">
                    <img src="/courts/padel.jpg" alt="Padel" />
                  </div>
                </div>
                <div className="box">
                  <div className="bg-img">
                    <img src="/courts/tennis.jpg" alt="Tennis" />
                  </div>
                </div>
                <div className="box">Badminton</div>
                <div className="box">
                  <div className="bg-img">
                    <img src="/courts/badminton.jpg" alt="Badminton" />
                  </div>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </>
  );
};

export default AnimatedHeroBanner;

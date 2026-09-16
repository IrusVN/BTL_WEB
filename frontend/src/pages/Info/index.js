import React from 'react';
import { Link } from 'react-router-dom';
import * as styles from './Info.module.scss';
import classNames from 'classnames/bind';
import accountIcon from '../../img/account-icon.png';
import { useHead } from '../../hooks/useHead.js';

const cx = classNames.bind(styles);

const Info = () => {
    useHead('Về chúng tôi');
  return (
    <div className={cx('wrapper')}>
      <div className={cx('profiles-container')}>
        {/* Thành viên 1 */}
        <aside className={cx('profile-card')}>
          <header>
            <a href="">
              <img src={accountIcon} alt="Avatar" />
            </a>
            <h1>Nguyễn Trần Hữu Thắng</h1>
            <h2>MSSV: 21001231</h2>
          </header>
          <div className={cx('profile-bio')}>
            <p>Học tại Đại học Công nghiệp Thành phố Hồ Chí Minh</p>
            <p>Email:</p>
            <a href="mailto:huuthanglovely@gmail.com" className={cx('email-link')}>huuthanglovely@gmail.com</a>
          </div>
          <ul className={cx('profile-social-links')}>
            <li>
              <a href="https://www.facebook.com/vuongnguyen1668/">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-3 7h-1.924c-.615 0-1.076.252-1.076.889v1.111h3l-.238 3h-2.762v8h-3v-8h-2v-3h2v-1.923c0-2.022 1.064-3.077 3.461-3.077h2.539v3z" />
                </svg>
              </a>
            </li>
            <li>
              <a href="https://www.instagram.com/vuongng_sr4?r=nametag">
                <svg height="24" width="24" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 551.034 551.034">
                  <g id="XMLID_13_">
                    <linearGradient id="XMLID_2_" gradientUnits="userSpaceOnUse" x1="275.517" y1="4.5714" x2="275.517" y2="549.7202" gradientTransform="matrix(1 0 0 -1 0 554)">
                      <stop offset="0" style={{ stopColor: '#E09B3D' }} />
                      <stop offset="0.3" style={{ stopColor: '#C74C4D' }} />
                      <stop offset="0.6" style={{ stopColor: '#C21975' }} />
                      <stop offset="1" style={{ stopColor: '#7024C4' }} />
                    </linearGradient>
                    <path id="XMLID_17_" style={{ fill: 'url(#XMLID_2_)' }} d="M386.878,0H164.156C73.64,0,0,73.64,0,164.156v222.722c0,90.516,73.64,164.156,164.156,164.156h222.722c90.516,0,164.156-73.64,164.156-164.156V164.156C551.033,73.64,477.393,0,386.878,0z" />
                  </g>
                </svg>
              </a>
            </li>
            <li>
              <a href="https://github.com/vuongng2212">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </li>
          </ul>
        </aside>

        {/* Thành viên 2 */}
        <aside className={cx('profile-card')}>
          <header>
            <a href="">
              <img src={accountIcon} alt="Avatar" />
            </a>
            <h1>Nguyễn Văn Chương</h1>
            <h2>MSSV: 21025231</h2>
          </header>
          <div className={cx('profile-bio')}>
            <p>Học tại Đại học Công nghiệp Thành phố Hồ Chí Minh</p>
            <p>Email:</p>
            <a href="mailto:namtrae@gmail.com" className={cx('email-link')}>namtrae@gmail.com</a>
          </div>
          <ul className={cx('profile-social-links')}>
            <li>
              <a href="https://www.facebook.com/tuan.phananh.986227">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-3 7h-1.924c-.615 0-1.076.252-1.076.889v1.111h3l-.238 3h-2.762v8h-3v-8h-2v-3h2v-1.923c0-2.022 1.064-3.077 3.461-3.077h2.539v3z" />
                </svg>
              </a>
            </li>
            <li>
              <a href="">
                <svg height="24" width="24" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 551.034 551.034">
                  <g id="XMLID_13_">
                    <linearGradient id="XMLID_2_" gradientUnits="userSpaceOnUse" x1="275.517" y1="4.5714" x2="275.517" y2="549.7202" gradientTransform="matrix(1 0 0 -1 0 554)">
                      <stop offset="0" style={{ stopColor: '#E09B3D' }} />
                      <stop offset="0.3" style={{ stopColor: '#C74C4D' }} />
                      <stop offset="0.6" style={{ stopColor: '#C21975' }} />
                      <stop offset="1" style={{ stopColor: '#7024C4' }} />
                    </linearGradient>
                    <path id="XMLID_17_" style={{ fill: 'url(#XMLID_2_)' }} d="M386.878,0H164.156C73.64,0,0,73.64,0,164.156v222.722c0,90.516,73.64,164.156,164.156,164.156h222.722c90.516,0,164.156-73.64,164.156-164.156V164.156C551.033,73.64,477.393,0,386.878,0z" />
                  </g>
                </svg>
              </a>
            </li>
            <li>
              <a href="https://github.com/PhanAnhTuan123">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </li>
          </ul>
        </aside>

        {/* Thành viên 3 */}
        <aside className={cx('profile-card')}>
          <header>
            <a href="">
              <img src={accountIcon} alt="Avatar" />
            </a>
            <h1>Mai Lê Huy Hoàng</h1>
            <h2>MSSV: 21134241</h2>
          </header>
          <div className={cx('profile-bio')}>
            <p>Học tại Đại học Công nghiệp Thành phố Hồ Chí Minh</p>
            <p>Email:</p>
            <a href="mailto:hoangmai020603@gmail.com" className={cx('email-link')}>hoangmai020603@gmail.com</a>
          </div>
          <ul className={cx('profile-social-links')}>
            <li>
              <a href="https://www.facebook.com/profile.php?id=100012824702612">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-3 7h-1.924c-.615 0-1.076.252-1.076.889v1.111h3l-.238 3h-2.762v8h-3v-8h-2v-3h2v-1.923c0-2.022 1.064-3.077 3.461-3.077h2.539v3z" />
                </svg>
              </a>
            </li>
            <li>
              <a href="">
                <svg height="24" width="24" version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 551.034 551.034">
                  <g id="XMLID_13_">
                    <linearGradient id="XMLID_2_" gradientUnits="userSpaceOnUse" x1="275.517" y1="4.5714" x2="275.517" y2="549.7202" gradientTransform="matrix(1 0 0 -1 0 554)">
                      <stop offset="0" style={{ stopColor: '#E09B3D' }} />
                      <stop offset="0.3" style={{ stopColor: '#C74C4D' }} />
                      <stop offset="0.6" style={{ stopColor: '#C21975' }} />
                      <stop offset="1" style={{ stopColor: '#7024C4' }} />
                    </linearGradient>
                    <path id="XMLID_17_" style={{ fill: 'url(#XMLID_2_)' }} d="M386.878,0H164.156C73.64,0,0,73.64,0,164.156v222.722c0,90.516,73.64,164.156,164.156,164.156h222.722c90.516,0,164.156-73.64,164.156-164.156V164.156C551.033,73.64,477.393,0,386.878,0z" />
                  </g>
                </svg>
              </a>
            </li>
            <li>
              <a href="https://github.com/HoangMaiLapTrinh">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                </svg>
              </a>
            </li>
          </ul>
        </aside>
      </div>
    </div>
  );
};

export default Info; 
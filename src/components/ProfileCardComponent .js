// ProfileCardComponent.js
import React from 'react';
import './ProfileCardComponent.css';

const ProfileCardComponent = () => {
    return (
        <>
            <div id="algn">
                <div id="card">
                    <div id="upper-bg">
                        <img
                            src="https://nasemul1.github.io/my-portfolio/profile-pic.png"
                            alt="profile-pic"
                            className="profile-pic"
                        />
                    </div>
                    <div id="lower-bg">
                        <div className="text">
                            <p className="name">Md. Nasemul Islam</p>
                            <p className="title">Web developer &amp; <br /> Competitive programmer</p>
                        </div>
                        <div id="icons">
                            <button type="button" className="ico"><img width="48" height="48" src="https://img.icons8.com/color/48/gmail-new.png" alt="gmail-new" /></button>
                            <button type="button" className="ico"><img width="48" height="48" src="https://img.icons8.com/fluency/48/github.png" alt="github" /></button>
                            <button type="button" className="ico"><img width="48" height="48" src="https://img.icons8.com/color/48/linkedin.png" alt="linkedin" /></button>
                            <button type="button" className="ico"><img width="48" height="48" src="https://img.icons8.com/color/48/facebook-new.png" alt="facebook-new" /></button>
                        </div>
                        <div id="btn">
                            <button className="msg">Subscribe</button>
                            <button className="msg">Message</button>
                        </div>
                        <div id="l-c-s">
                            <div className="num">
                                <img width="48" height="48" src="https://img.icons8.com/fluency-systems-regular/48/facebook-like--v1.png" alt="facebook-like--v1" />
                                <span>35k</span>
                            </div>
                            <div className="num dvr"></div>
                            <div className="num">
                                <img width="48" height="48" src="https://img.icons8.com/fluency-systems-regular/48/speech-bubble--v1.png" alt="speech-bubble--v1" />
                                <span>20k</span>
                            </div>
                            <div className="num dvr"></div>
                            <div className="num">
                                <img width="48" height="48" src="https://img.icons8.com/pulsar-line/48/share.png" alt="share" />
                                <span>15k</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

        </>
    );
};

export default ProfileCardComponent;

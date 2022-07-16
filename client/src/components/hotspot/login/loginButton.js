/* eslint-disable jsx-a11y/anchor-is-valid */
import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLaptopCode } from '@fortawesome/free-solid-svg-icons'
import { faFacebookF, faGoogle, faTwitter } from "@fortawesome/free-brands-svg-icons"

const facebookIcon = <FontAwesomeIcon icon={faFacebookF} />
const googleIcon = <FontAwesomeIcon icon={faGoogle} />
const twitterIcon = <FontAwesomeIcon icon={faTwitter} />
const macIcon = <FontAwesomeIcon icon={faLaptopCode} />


function LoginButton(props) {
    // console.log('props: ', props);

    return (
        <div>
            {
                props.isNewUser && (
                    <div className="center">
                    <div className="policy">
                        <input type="checkbox" value="policy" name="policy" checked={props.checked} onChange={props.handleCheckbox} />
                        <span> </span>
                        <label style={{textAlign: 'center'}}>
                        I <strong>ACCEPT</strong> the terms and conditions of the 
                        <a href="#"> User Agreement</a> and
                        <a href="#"> Privacy Policy</a>
                        </label>
                    </div>
                    <br />
                    <p id="warning" className="warning">You must accept the terms and conditions before logging in!</p>
                    <p className="inst"> 
                        If you lose your internet connection please go to
                        <a href="hotspot.local"> hotspot.local </a>
                        on your browser to come back to this page and login again.
                    </p>
                    
                    <a href={props.backendUrl + "/auth/facebook"} className="fblogin btn" onClick={(event) => {
                        event.preventDefault();
                        // let otherModal = document.getElementById('otherModal');
                        let otherModal = props.otherModal;
                        // let warning = document.getElementById('warning');
                        let warning = props.warning;
                        if(props.checked) {
                            warning.style.display = 'none';
                            otherModal.style.display = 'block';
                            console.log("backend: " + props.backendUrl);
                            window.location = props.backendUrl + "/auth/facebook";
                        } else {
                            warning.style.display = 'block';
                        }
                    }}><i className="socialIcon">{facebookIcon}</i> Login with Facebook</a>
                    <a href={props.backendUrl + "/auth/google"} className=" googlelogin btn" onClick={(event) => {
                        event.preventDefault();
                        let otherModal = props.otherModal;
                        let warning = props.warning;
                        if(props.checked) {
                            warning.style.display = 'none';
                            otherModal.style.display = 'block';
                            console.log("backend: " + props.backendUrl);
                            window.location = props.backendUrl + "/auth/google";
                        } else {
                            warning.style.display = 'block';
                        }
                    }}><i className="socialIcon">{googleIcon}</i> Login with Google</a>
                    <a href={props.backendUrl + "/auth/twitter"} className=" twitterlogin btn" onClick={(event) => {
                        event.preventDefault();
                        let otherModal = props.otherModal;
                        let warning = props.warning;
                        if(props.checked) {
                            warning.style.display = 'none';
                            otherModal.style.display = 'block';
                            console.log("backend: " + props.backendUrl);
                            window.location = props.backendUrl + "/auth/twitter";
                        } else {
                            warning.style.display = 'block';
                        }
                    }}><i className="socialIcon">{twitterIcon}</i> Login with Twitter</a>
                    <a href="#" className="btn maclogin" onClick={event => {
                        event.preventDefault();
                        let otherModal = props.otherModal;
                        let warning = props.warning;
                        if(props.checked) {
                            warning.style.display = 'none';
                            otherModal.style.display = 'block';
                            const requestOptions = {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    macAddress: props.fields.mac,
                                    ipAddress: props.fields.ip,
                                    advertId: '3178ae0d5139867c55b13021',
                                    deviceId: '9178ae0d5139868c57b13037'
                                })
                            };
                            fetch(props.backendUrl + '/api/v1/users', requestOptions)
                            .then(response => response.json())
                            .then(data => {
                                otherModal.style.display = 'none';
                                console.log('create user and advise response: ', data);
                                let link = `${props.fields.url}?username=${props.fields.username}&password=${props.fields.password}&dst=${props.fields.dst}&popup=false`;
                                console.log('link: ', link);
                                window.location = link;
                                })
                            .catch(err => console.error('error: ', err));
                        } else {
                            warning.style.display = 'block';
                        }
                    }}><i className="socialIcon">{macIcon}</i> Login with Ip Address</a>
                    </div>
                )
            }
            {
                props.isNewUser === null && (
                    <div className="noUserInst center">
                    <p>Loading User. Please give us a moment...</p>
                    <p>If this page persists. Please <a href="sms:+254 708 072 998">click here</a> to contact the system admin.</p> 
                    </div>
                )
            }
            {
                props.isNewUser === false && (
                    <div className="welcomeBack center">
                    <img className="m1" height={50} width={50} src={props.user.picture_url} alt="User Profile Photo" />
                    <h3 className="m1">Welcome back {props.user.first_name + " " + props.user.last_name}</h3>
                    <p className="m1">If you lose your internet access, 
                        please go to <a href="http://hostpot.local">http://hotspot.local</a> on your
                        brower to come back to this page and get it back.</p>
                    <p className="m1">
                        <a href="sms:+254 708 072 998">Click here</a> to text the system admin in case of any issues.
                        Click the button below to get internet access.
                    </p>
                    <a className="m1 btn txt-center" style={{backgroundColor: 'green'}} href="#" onClick={event => {
                        event.preventDefault();
                        // let otherModal = document.getElementById('otherModal');
                        let otherModal = props.otherModal;
                        otherModal.style.display = 'block';
                        const requestOptions = {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                adId: Math.floor(Math.random() * 100000 + 1),
                                userId: props.user._id,
                                deviceId: Math.floor(Math.random() * 100000 + 1)
                            })
                        };
                        fetch(props.backendUrl + '/api/v1/adviews', requestOptions)
                        .then(response => response.json())
                        .then(data => {
                            otherModal.style.display = 'none';
                            console.log('create adview for user response: ', data);
                            let link = `${props.fields.url}?username=${props.fields.username}&password=${props.fields.password}&dst=${props.fields.dst}&popup=false`;
                            console.log('link: ', link);
                            window.location = link;
                            })
                        .catch(err => console.error('error: ', err));
                    }}>Continue</a>
                    </div>
                )
            }
        </div>
    )
}

export default LoginButton

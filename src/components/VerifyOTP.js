import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { API_BASE_URL } from '../utils/apiConfig';
import LoadingBar from './LoadingBar';

function VerifyOTP() {
    const location = useLocation();
    const history = useHistory();
    const phone = new URLSearchParams(location.search).get('mobile');

    const [otp, setOTP] = useState('');
    const [verificationMessage, setVerificationMessage] = useState('');
    const [isVerified, setIsVerified] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [verifiedPhoneNumber, setVerifiedPhoneNumber] = useState('');
    const formattedPhone = phone ? phone.replace(/\s/g, '%20') : '';

    const handleVerify = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const apiUrl = `${API_BASE_URL}/users/verify`;

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ phone: formattedPhone, otp }),
            });

            await response.json();


            if (response.ok) {
                setVerificationMessage('OTP verification successful');
                setIsVerified(true);
                setVerifiedPhoneNumber(phone); // Store the verified phone number
            } else {
                setVerificationMessage('OTP verification failed');
            }
        } catch (error) {
            console.error('Error:', error);
            setVerificationMessage('An error occurred during OTP verification');
        } finally {
            setIsLoading(false);
        }
    };

    const isButtonDisabled = !otp || isVerified;

    return (
        <Wrapper className="section-center">
            <div className="contain">
                <h3>Verify OTP</h3>
                <LoadingBar isLoading={isLoading} />
                {isVerified ? (
                    <div>
                        <p>
                            Phone number ({verifiedPhoneNumber}) verification is{' '}
                            <strong>Success</strong>
                        </p>
                        <div className="success-animation" /> {/* Add your success animation component here */}
                        <button className="formSubmit" onClick={() => history.push('/Login')}>
                            Login
                        </button>
                    </div>
                ) : (
                    <React.Fragment>
                        <p>Please enter the OTP sent to your mobile:</p>
                        <form className="form">
                            <input
                                className="formInput"
                                type="text"
                                value={otp}
                                onChange={(e) => setOTP(e.target.value)}
                                placeholder="Enter OTP"
                            />
                            <button
                                className={`formSubmit ${isButtonDisabled ? 'disabled' : ''}`}
                                type="submit"
                                disabled={isButtonDisabled}
                                onClick={(e) => handleVerify(e)}
                            >
                                {isLoading ? 'Verifying...' : 'Verify OTP'}
                            </button>
                            {verificationMessage && <p>{verificationMessage}</p>}
                        </form>
                        <div className="resendButtons">
                            <p>Haven't received the OTP?</p>
                            <button className="reButtons">Resend</button>
                        </div>
                    </React.Fragment>
                )}
            </div>
        </Wrapper>
    );
}

const Wrapper = styled.section`
display: flex;
flex-direction: column;
justify-content: space-between;
align-items: center;

.contain {
  max-width: 40rem;
  margin-top: 2rem;
  margin-bottom: 4rem;
padding-top: 35px;
display: flex;
flex-direction: column;
background: var(--clr-white);
border-radius: var(--radius);
box-shadow: var(--light-shadow);
transition: var(--transition);
padding: 2rem;
width: 90vw;
height: 500px;
margin: 10 auto;
align-items: center;
}


.contain:hover {
    box-shadow: var(--dark-shadow);
  }


.form {
    display: flex;
    padding: 10px;
    flex-direction: column;
    width: 350px;
    height: 300px;
}
.formInput {
    border-radius: 5px;
    border-color: #e5e5e5;
    border-style: solid;
    border-width: 0.5px;
    margin-bottom: 10px;
    padding: 10px;
}

.formSubmit {
    cursor:pointer;
    border-radius: 5px;
    background-color:#cd3240;
    border: 2px solid transparent;
    color: white; 
    width: 280px;
    padding-top: 8px;
margin-top:20px;
align-items: center;
  
}
/* Disabled button style */
.formSubmit.disabled {
    background-color: #ccc; /* Change the background color when disabled */
    cursor: not-allowed; /* Change cursor to not-allowed when disabled */
}


.terms-checkbox {
    display: flex;
    align-items: center;
    margin-top: 10px; /* Adjust the margin as needed */
  }
  
  .terms-checkbox input[type="checkbox"] {
    margin-right: 10px; /* Adjust the margin between the checkbox and label */
  }
  
  .terms-checkbox label {
    font-size: 14px; /* Adjust the font size as needed */
    color: #333; /* Adjust the text color */
  }   
  
  
  .resendButtons{
    display: grid;
  grid-template-columns: 1fr auto;
   margin-bottom:4rem;
   gap:1px;
  justify-items: center;
  align-items: center; 
  }
  .reButtons{
    border-radius: 5px;
    background-color:#cd3240;
    border: 2px solid transparent;
    color: var(--clr-white);  
    width: 100px;   
    cursor:pointer;
  }
  .done{
    margin-left:9rem;
    display: flex;
    justify-content: center; /* Horizontal centering */
    align-items: center; /* Vertical centering */
  }
  @media (min-width: 992px) 
  {
    height: 100vh;
    
  }
  .success-animation {
    margin-left:8rem;
    width: 100px;
    height: 100px;
    background: url('https://www.svgrepo.com/show/13650/success.svg') no-repeat;
    background-size: contain;
    animation: scaleUp 0.5s ease-in-out;

    @keyframes scaleUp {
      0% {
        transform: scale(0);
        opacity: 0;
      }
      100% {
        transform: scale(1);
        opacity: 1;
      }
    }
`

export default VerifyOTP;

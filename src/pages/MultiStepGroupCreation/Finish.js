import React, { useContext } from 'react';
import AppContext from './Context';
import './styles.css';
import WhatsNext from '../../components/WhatsNext';
import { useUserContext } from '../../context/user_context';
import { useHistory } from 'react-router-dom';

const Finish = () => {

    const { isLoggedIn } = useUserContext();


    const myContext = useContext(AppContext);
    const updateContext = myContext.groupDetails;
    const history = useHistory();
    const name = updateContext.groupName;
    const groupId = updateContext.groupId;
    console.log('Mani checking ');

    console.log(groupId);
    const handleBackButtonClick = () => {
        history.push('/chit-fund/user/home'); // Replace '/' with the actual URL of your home page
    };

    return (
        <div className="container">
            <p>New Group <strong>{name}</strong>   has been created successfully</p>
            <img className="done" src="https://www.svgrepo.com/show/13650/success.svg" alt="successful" />
            <p>Thanks for your details</p>

            {isLoggedIn && (
                <button className='back-button' onClick={handleBackButtonClick}>
                    Back to Home
                </button>
            )}
            <WhatsNext groupId={groupId} />
        </div>
    );
};

export default Finish;

import React from 'react';
import styled from 'styled-components';

const AvatarGroupContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-start;
  align-items: center;
  max-width: 100%;
  

  &.rtl {
    direction: rtl;
    .avatar:hover:not(:last-of-type) {
      transform: translate(10px);    
    }
  }

  .hidden-avatars {
    width: 50px;
    height: 50px;
    border-radius: 50%;
    display: flex;
    justify-content: center;
    align-items: center;
    margin-left: 3px;
    margin-right: 23px;
    background-color: #2c303a;
    color: #fff;
  }

  .avatar {
    width: 50px;
    height: 50px;
    overflow: hidden;
    border-radius: 50%;
    position: relative;
    background-color: #2c303a;
    border: 2px solid #2c303a;
    img {
      object-fit: cover;
      width: 100%;
      height: 100%;
    }
    margin-left: -20px;
    transition: transform 0.3s ease;
    cursor: pointer;
    &:hover:not(:last-of-type) {
      transform: translate(-20px);
    }
  }
`;

const AvatarGroup = ({ avatars }) => {
  console.log('avatar list ');
  console.log(avatars);

  //const [loading, setLoading] = useState(true);
  // const [error, setError] = useState(null);



  // if (loading) {
  //   return <p>Loading...</p>;
  // }

  // if (error) {
  //   return <p>Error: {error}</p>;
  // }

  return (
    <AvatarGroupContainer className="avatar-group">
      <div className="hidden-avatars">+{avatars?.length}</div>
      {avatars.map((avatar, index) => (
        <div className="avatar" key={index}>
          {avatar.user_image_from_s3 ? ( // Change to use 'avatar.user_image'
            <img src={avatar.user_image_from_s3} alt={avatar.name} />
          ) : (
            <img src="default-image.jpg" alt={avatar.name} />
          )}
        </div>
      ))}
    </AvatarGroupContainer>
  );
};

export default AvatarGroup;

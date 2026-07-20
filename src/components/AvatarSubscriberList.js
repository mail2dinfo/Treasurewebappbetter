import React, { useState, useEffect, useRef } from 'react';
import styled from "styled-components";
import { downloadImage } from '../utils/downloadImage';
import { API_BASE_URL } from '../utils/apiConfig';

const AvatarGroupContainer = styled.div`
  display: flex;
  flex-wrap: wrap;

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
    width: 90px;
    height: 90px;
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

    transition: transform 0.3s ease;
    cursor: pointer;

    &:hover:not(:last-of-type) {
      transform: translate(-20px);
    }
  }

  .avatar_container {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    justify-content: center;
    text-align: center;
    margin: 10px; /* Added spacing between avatars */
  }
`;

const AvatarSubscriberList = ({ groupSubscriber }) => {


  // fetch from aws bucket 

  const imageCache = useRef({}); // ✅ Persistent Cache for Images
  const [isImagesLoaded, setIsImagesLoaded] = useState(false); // Tracks image fetching status

  const [imageMap, setImageMap] = useState({});  // Stores images for each user


  // **Step 1: Fetch Images First Before Any Filtering**
  useEffect(() => {
    const fetchImages = async () => {
      if (!groupSubscriber || groupSubscriber.length === 0) {
        setIsImagesLoaded(true);  // If no data, mark as loaded
        return;
      }

      const newImageMap = { ...imageMap };
      let hasNewImages = false;


      try {
        await Promise.all(groupSubscriber.map(async (person) => {
          const { user_image, unique_id } = person;

          // Skip if already cached
          if (imageCache.current[unique_id]) {
            newImageMap[unique_id] = imageCache.current[unique_id];
            return;
          }

          let finalUrl = "default-image.jpg"; // Default fallback
          if (user_image && user_image.includes("s3.ap-south-1.amazonaws.com")) {
            const imageKey = user_image.split('/').pop();
            try {
              const downloadedUrl = await downloadImage(imageKey, API_BASE_URL);
              if (downloadedUrl) {
                finalUrl = downloadedUrl;
              }
            } catch (error) {
              console.error(`Error fetching image for ${unique_id}:`, error);
            }
          } else if (user_image) {
            finalUrl = user_image;
          }

          newImageMap[unique_id] = finalUrl;
          imageCache.current[unique_id] = finalUrl;
          hasNewImages = true;
        }));

        if (hasNewImages) {
          setImageMap((prev) => ({ ...prev, ...newImageMap }));
        }

        setIsImagesLoaded(true);  // ✅ Mark images as loaded
      } catch (error) {
        console.error("Error fetching images:", error);
      } finally {
        // ✅ Ensure loading is stopped in all cases
      }
    };

    fetchImages();
  }, [groupSubscriber]);

  if (!Array.isArray(groupSubscriber) || groupSubscriber.length === 0) {
    return <p>No subscribers available</p>;
  }

  return (
    <AvatarGroupContainer className="avatar-group">
      <div className="hidden-avatars">+{groupSubscriber.length}</div>
      {groupSubscriber.map((dat, index) => {
        return (
          <div className="avatar_container" key={index}>
            <div className="avatar">
              {!isImagesLoaded ? (
                <p>Loading images...</p>
              ) : (
                <img
                  src={dat.user_image_from_s3 || "default-image.jpg"}
                  alt={dat.name}
                  onError={(e) => { e.target.src = "default-image.jpg"; }}  // ✅ Fallback in case of error
                />
              )}
            </div>
            <div className="avatar-label">{dat.name}</div>
          </div>
        );
      })}
    </AvatarGroupContainer>
  );

};

export default AvatarSubscriberList;

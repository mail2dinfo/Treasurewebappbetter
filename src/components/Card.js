// import React from 'react';
// import { useUserContext } from '../context/user_context';
// import styled from 'styled-components';
// import { MdBusiness, MdLocationOn, MdVoicemail } from 'react-icons/md';
// import { useHistory } from 'react-router-dom';
// import { hasPermission } from '../rbacPermissionUtils';

// const Card = () => {
//   const history = useHistory();
//   const { user, userRole } = useUserContext();



//   // Default preview image
//   const DEFAULT_IMAGE = defaultLogo;

//   console.log("He llo i am from card");
//   console.log(user.results);
//   // Extract user company data safely
//   const userCompany = user.results?.userCompany || null;
//   console.log("User Company Data:", userCompany);
//   const isUserCompanyEmpty = !userCompany;

//   // Construct user details
//   const userd = {
//     avatar_url: userCompany?.logo_s3_image || DEFAULT_IMAGE,
//     name: userCompany?.name || '',
//     company: userCompany?.phone || '',
//     location: userCompany?.street_address || '',
//     city: userCompany?.city || '',
//     state: userCompany?.state || '',
//     email: userCompany?.email || '',
//     bio: 'Welcome Managing Director',
//     since: userCompany?.company_since || '',
//   };

//   const { avatar_url, name, company, location, city, state, email, bio } = userd;

//   const handleStartCompany = () => history.push('/chit-fund/user/companies');

//   return (
//     <Wrapper>
//       {isUserCompanyEmpty ? (
//         <div className="welcome-guest">
//           <p>Hello, Guest</p>
//           {hasPermission(userRole, 'startCompany') && (
//             <button className="start-group-button" onClick={handleStartCompany}>
//               Start Company
//             </button>
//           )}
//         </div>
//       ) : (
//         <div className="company-info">
//           <header>
//             <img src={avatar_url} alt={name} />
//             <div>
//               <h4>{name}</h4>
//               <p>@{name || 'organiser'}</p>
//             </div>
//             {userRole === 'User' && <a onClick={handleStartCompany}>Edit Company</a>}
//           </header>
//           <p className="bio">{bio}</p>
//           <div className="links">
//             <p>
//               <MdLocationOn /> {location}, {city}, {state}
//             </p>
//             <p>
//               <MdVoicemail /> {email}
//             </p>
//             <p>
//               <MdBusiness /> {company}
//             </p>
//           </div>
//         </div>
//       )}
//     </Wrapper>
//   );
// };

// // const Wrapper = styled.article`
// //   background: var(--clr-white);
// //   padding: 1.5rem 2rem;
// //   border-radius: var(--radius);
// //   position: relative;

// //   &::before {
// //     content: 'Welcome';
// //     position: absolute;
// //     top: 0;
// //     left: 0;
// //     transform: translateY(-100%);
// //     color: var(--clr-grey-5);
// //     text-transform: capitalize;
// //     padding: 0.5rem 1rem;
// //     font-size: 1rem;
// //   }

// //   header {
// //     display: flex;
// //     align-items: center;
// //     column-gap: 1rem;
// //     margin-bottom: 1rem;

// //     img {
// //       width: 75px;
// //       height: 75px;
// //       border-radius: 50%;
// //     }

// //     h4 {
// //       margin-bottom: 0.25rem;
// //     }

// //     p {
// //       margin-bottom: 0;
// //     }

// //     a {
// //       color: var(--clr-primary-5);
// //       border: 1px solid var(--clr-primary-5);
// //       padding: 0.25rem 0.75rem;
// //       border-radius: 1rem;
// //       text-transform: capitalize;
// //       cursor: pointer;

// //       &:hover {
// //         background: var(--clr-primary-5);
// //         color: var(--clr-white);
// //       }
// //     }
// //   }

// //   .bio {
// //     color: var(--clr-grey-3);
// //   }

// //   .links p {
// //     margin-bottom: 0.25rem;
// //     display: flex;
// //     align-items: center;

// //     svg {
// //       margin-right: 0.5rem;
// //       font-size: 1.3rem;
// //     }
// //   }

// //   .start-group-button {
// //     background-color: var(--clr-red-dark);
// //     color: #fff;
// //     border: none;
// //     border-radius: 10px;
// //     padding: 10px 50px;
// //     width: 200px;
// //     margin: 10px 60px;
// //     cursor: pointer;
// //   }
// // `;

// const Wrapper = styled.article`
//   background: #f0f4f8; /* Updated background color */
//   padding: 1.5rem 2rem;
//   border-radius: var(--radius);
//   position: relative;

//   &::before {
//     content: 'Welcome';
//     position: absolute;
//     top: 0;
//     left: 0;
//     transform: translateY(-100%);
//     color: var(--clr-grey-5);
//     text-transform: capitalize;
//     padding: 0.5rem 1rem;
//     font-size: 1rem;
//   }

//   header {
//     display: flex;
//     align-items: center;
//     column-gap: 1rem;
//     margin-bottom: 1rem;

//     img {
//       width: 75px;
//       height: 75px;
//       border-radius: 50%;
//     }

//     h4 {
//       margin-bottom: 0.25rem;
//     }

//     p {
//       margin-bottom: 0;
//     }

//     a {
//       color: var(--clr-primary-5);
//       border: 1px solid var(--clr-primary-5);
//       padding: 0.25rem 0.75rem;
//       border-radius: 1rem;
//       text-transform: capitalize;
//       cursor: pointer;

//       &:hover {
//         background: var(--clr-primary-5);
//         color: var(--clr-white);
//       }
//     }
//   }

//   .bio {
//     color: var(--clr-grey-3);
//   }

//   .links p {
//     margin-bottom: 0.25rem;
//     display: flex;
//     align-items: center;

//     svg {
//       margin-right: 0.5rem;
//       font-size: 1.3rem;
//     }
//   }

//   .start-group-button {
//     background-color: var(--clr-red-dark);
//     color: #fff;
//     border: none;
//     border-radius: 10px;
//     padding: 10px 50px;
//     width: 200px;
//     margin: 10px 60px;
//     cursor: pointer;
//   }
// `;


// export default Card;

import React, { useState } from 'react';
import { useUserContext } from '../context/user_context';
import styled from 'styled-components';
import { MdBusiness, MdLocationOn, MdVoicemail } from 'react-icons/md';
import { useHistory } from 'react-router-dom';
import { hasPermission } from '../rbacPermissionUtils';
import defaultLogo from '../assets/logo.png';

const Card = () => {
  const history = useHistory();
  const { user, userRole } = useUserContext();
  const [imageError, setImageError] = useState(false);

  const DEFAULT_IMAGE = defaultLogo;
  const userCompany = user.results?.userCompany || null;
  const isUserCompanyEmpty = !userCompany;

  const userd = {
    avatar_url: (userCompany?.logo_s3_image && userCompany.logo_s3_image.trim() !== '' && !imageError)
      ? userCompany.logo_s3_image
      : DEFAULT_IMAGE,
    name: userCompany?.name || '',
    company: userCompany?.phone || '',
    location: userCompany?.street_address || '',
    city: userCompany?.city || '',
    state: userCompany?.state || '',
    email: userCompany?.email || '',
    bio: 'Welcome Managing Director',
    since: userCompany?.company_since || '',
  };

  const { avatar_url, name, company, location, city, state, email, bio } = userd;

  const handleStartCompany = () => history.push('/chit-fund/user/companies');

  const handleImageError = () => {
    console.log('Company logo failed to load, using default logo');
    setImageError(true);
  };

  return (
    <Wrapper>
      {isUserCompanyEmpty ? (
        <div className="welcome-guest">
          <p className="guest-text">Hello, Guest</p>
          {hasPermission(userRole, 'startCompany') && (
            <button className="start-group-button" onClick={handleStartCompany}>
              Start Company
            </button>
          )}
        </div>
      ) : (
        <div className="company-info">
          <header>
            <img
              src={imageError ? DEFAULT_IMAGE : avatar_url}
              alt={name}
              onError={handleImageError}
            />
            <div className="header-text">
              <h4>{name}</h4>
              <p>@{name || 'organiser'}</p>
            </div>
            {userRole === 'User' && (
              <a
                href="#edit-company"
                onClick={(e) => {
                  e.preventDefault();
                  handleStartCompany();
                }}
              >
                Edit Company
              </a>
            )}
          </header>
          <p className="bio">{bio}</p>
          <div className="links">
            <p><MdLocationOn /> {location}, {city}, {state}</p>
            <p><MdVoicemail /> {email}</p>
            <p><MdBusiness /> {company}</p>
          </div>
        </div>
      )}
    </Wrapper>
  );
};

const Wrapper = styled.article`
  background: #fff;
  padding: 1.8rem 2rem;
  border-radius: 1rem;
  position: relative;
  box-shadow: 0 4px 15px rgba(0,0,0,0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
  border-top: 5px solid #d62828; /* MyTreasure Red Accent */

  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 6px 20px rgba(0,0,0,0.12);
  }

  &::before {
    content: 'Welcome';
    position: absolute;
    top: -14px;
    left: 15px;
    background: #d62828;
    color: #fff;
    padding: 0.3rem 0.8rem;
    border-radius: 0.5rem;
    font-size: 0.85rem;
    font-weight: 500;
  }

  header {
    display: flex;
    align-items: center;
    column-gap: 1rem;
    margin-bottom: 1rem;
    flex-wrap: wrap; /* allows wrapping on mobile */

    img {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 2px solid #d62828;
      object-fit: cover;
    }

    .header-text h4 {
      margin-bottom: 0.25rem;
      font-size: 1.2rem;
      font-weight: 600;
      color: #333;
    }

    .header-text p {
      margin-bottom: 0;
      color: #888;
      font-size: 0.9rem;
    }

    a {
      margin-left: auto;
      color: #d62828;
      border: 1px solid #d62828;
      padding: 0.25rem 0.75rem;
      border-radius: 1rem;
      text-transform: capitalize;
      font-size: 0.85rem;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        background: #d62828;
        color: #fff;
      }
    }
  }

  .bio {
    color: #555;
    margin-bottom: 1rem;
    font-size: 0.95rem;
  }

  .links p {
    margin-bottom: 0.4rem;
    display: flex;
    align-items: center;
    color: #444;
    font-size: 0.9rem;
    word-break: break-word; /* prevents overflow on small screens */

    svg {
      margin-right: 0.5rem;
      font-size: 1.2rem;
      color: #d62828;
      flex-shrink: 0;
    }
  }

  .welcome-guest {
    text-align: center;
    padding: 1rem;
  }

  .guest-text {
    font-size: 1.1rem;
    margin-bottom: 0.8rem;
    color: #444;
  }

  .start-group-button {
    background-color: #d62828;
    color: #fff;
    border: none;
    border-radius: 8px;
    padding: 10px 40px;
    font-size: 0.95rem;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.2s ease;

    &:hover {
      background-color: #b81f1f;
    }
  }

  /* --- Mobile responsiveness --- */
  @media (max-width: 768px) {
    padding: 1.2rem 1.5rem;

    header {
      flex-direction: column;
      align-items: center;
      text-align: center;

      a {
        margin-top: 0.6rem;
        margin-left: 0;
      }
    }

    .header-text h4 {
      font-size: 1.1rem;
    }

    .header-text p {
      font-size: 0.85rem;
    }

    .links p {
      font-size: 0.85rem;
    }

    img {
      width: 70px;
      height: 70px;
    }

    .start-group-button {
      width: 100%;
      max-width: 280px;
      padding: 10px;
    }
  }

  @media (max-width: 480px) {
    padding: 1rem;

    &::before {
      font-size: 0.75rem;
      padding: 0.2rem 0.6rem;
    }

    .bio {
      font-size: 0.85rem;
    }

    .links p {
      font-size: 0.8rem;
    }
  }
`;

export default Card;


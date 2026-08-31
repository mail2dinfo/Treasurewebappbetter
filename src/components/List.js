import React, { useState } from 'react';
import { FaEdit, FaTrash } from 'react-icons/fa';
import { sortByTicketId } from '../utils/groupTicketCapacity';

const List = ({ items, removeItem, editItem }) => {
    const [subscriberFilter, setSubscriberFilter] = useState('');

    // Filter items based on the subscriber name
    const filteredItems = sortByTicketId(
        items.filter((item) =>
            item.name.toLowerCase().includes(subscriberFilter.toLowerCase())
        )
    );

    return (
        <>
            <div className="filter-section">
                <input
                    type="text"
                    placeholder="Filter by Subscriber Name"
                    value={subscriberFilter}
                    onChange={(e) => setSubscriberFilter(e.target.value)}
                    style={{
                        height: '40px',
                        padding: '0.25rem',
                        paddingLeft: '1rem',
                        background: 'var(--clr-grey-10)',
                        borderRadius: 'var(--radius)',
                        borderColor: 'transparent',
                        fontSize: '1rem',
                        flex: '1 0 auto',
                        color: 'var(--clr-grey-5)',
                        marginBottom: '1rem'
                    }}
                />
            </div>

            <div className='subcriber-list'>
                {/* Header Row */}
                <article className='subcriber-header' style={{ padding: "4px 16px" }}>
                    <p>Image</p>
                    <p>Name</p>
                    <p>Phone</p>
                    <p>Ticket</p>
                    <p>Share Amnt</p>
                    <p>Percentage %</p>
                </article>

                {/* Render filtered items */}
                {filteredItems.length > 0 ? (
                    filteredItems.map((item) => {
                        const { id, name, phone, user_image_from_s3, accountshare_id, accountshare_amount, accountshare_percentage, group_subscriber_id } = item;
                        return (
                            <article className='subcriber-item' key={id}>
                                <img src={user_image_from_s3} alt={name} />
                                <p className='title'>{name}</p>
                                <p className='title'>{phone}</p>
                                <p className='Ticket'>{accountshare_id}</p>
                                <p className='Acc Share Amnt'>{accountshare_amount}</p>
                                <p className='Percentage'>{accountshare_percentage}</p>

                                <div className='btn-container'>
                                    <button
                                        type='button'
                                        className='edit-btn'
                                        onClick={() => editItem(group_subscriber_id)}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        type='button'
                                        className='delete-btn'
                                        onClick={() => removeItem(group_subscriber_id)}
                                    >
                                        <FaTrash />
                                    </button>
                                </div>
                            </article>
                        );
                    })
                ) : (
                    <p style={{ textAlign: 'center', marginTop: '10px', color: 'gray' }}>No matching records found</p>
                )}
            </div>
        </>
    );
};

export default List;

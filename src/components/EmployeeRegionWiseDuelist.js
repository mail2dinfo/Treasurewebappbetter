import React from 'react';

const EmployeeRegionWiseDuelist = ({ items, removeItem, editItem, closeItem }) => {
    console.log('Mani- items ');
    console.log(items);
    const truncateText = (text, maxLength) => {
        if (text.length <= maxLength) {
            return text;
        }
        return text.substr(0, maxLength) + '...';
    };

    return (
        <div className='subcriber-list'>
            <button className="close-button" onClick={closeItem}>x</button>

            <article className='subcriber-header' style={{ padding: "4px 16px" }}>
                <p >Area</p>
                <p >Assigned Amount</p>
                <p >Collected Amount</p>
                <p >Due</p>

            </article>
            {items?.map((item, index) => {
                const { aob, amount_assigned, amount_collected, due } = item;



                return (
                    // <Link
                    //     to={`/groups/${group_id}/accounts/${grpAccountId}`} // Replace with your route path
                    //     key={index}
                    // >
                    <article className='subcriber-item' key={index}
                    >
                        <p className='title'>{truncateText(aob, 10)}</p>
                        <p className='title'>{amount_assigned}</p>   <p className='title'>
                            {amount_collected}</p>
                        <p className='title'>{due}</p>


                    </article>
                    // </Link>
                );
            })}
        </div >
    );
};

export default EmployeeRegionWiseDuelist;

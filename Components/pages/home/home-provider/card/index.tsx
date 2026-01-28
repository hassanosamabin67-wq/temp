import React from 'react'
import Image from 'next/image'

function Card({ card, bgClass }: any) {
  return (
    <div className={`card-homeprovider ${bgClass}`}>
      <div className='card_a'><Image src={card?.img} alt='' width={200} height={200} /></div>
      <div className='card_b'><h2>{card?.title}</h2></div>
      {/* <div className='card_c'><p>{card?.description}</p></div> */}
    </div>
  )
}

export default Card
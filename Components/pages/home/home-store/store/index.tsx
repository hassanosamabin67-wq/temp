import Image from "next/image";
import React from "react";
import "../style.css";

function Store({ store, handleRoute }: any) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div className="store_class">
        <div className="cs_ab">
          <h2>{store?.title}</h2>
        </div>
        <div className="cs_aa">
          <Image src={store?.img} alt="Online Event" height={250} width={250} />

          <div className="view_button" onClick={() => handleRoute(store)}>
            View
          </div>
        </div>
      </div>
    </div>
  );
}

export default Store;

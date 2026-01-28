// import "./styles.css";
import React, { useEffect, useState } from "react";
import Select from "react-select";

interface countrySelextion {
    selectedCountry: any;
    setSelectedCountry: any;  
}
const CountrySelect = ({selectedCountry,setSelectedCountry}:countrySelextion) => {
  const [countries, setCountries] = useState([]);

  useEffect(() => {
    fetch(
      "https://valid.layercode.workers.dev/list/countries?format=select&flags=true&value=code"
    )
      .then((response) => response.json())
      .then((data) => {
        setCountries(data.countries);
        setSelectedCountry(data?.userSelectValue);
      });
  }, []);
  return (
    <Select
    required
      options={countries}
      value={selectedCountry}
      onChange={(selectedOption) => setSelectedCountry(selectedOption)}
    />
  );
};
export default CountrySelect;
import SearchPageCoponent from '@/Components/pages/services/search'
import React from 'react'

function SearchPage({params }:any) {
  return (
    <div><SearchPageCoponent search={params?.search} /></div>
  )
}

export default SearchPage
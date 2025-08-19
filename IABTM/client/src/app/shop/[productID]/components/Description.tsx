import React from "react"

interface DescriptionProps {
  product: {
    title: string
    description: string
  }
}

const Description: React.FC<DescriptionProps> = ({ product }) => {
  return (
    <div className="p-4 md:p-8">
      <h2 className="text-2xl font-semibold mb-4">{product.title}</h2>
      <p className="text-base text-gray-700 max-w-3xl leading-relaxed">{product.description}</p>
    </div>
  )
}

export default Description

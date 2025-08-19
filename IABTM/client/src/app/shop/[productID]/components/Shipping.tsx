export default function Shipping() {
    return (
      <div>
        <h2 className="text-xl font-semibold mb-4">Shipping</h2>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Review the cost and speed of delivery before offering a shipping service</li>
          <li>Specify clearly when the item will be shipped</li>
          <li>Ship items within the handling time specified in the listing</li>
          <li>Only include shipping charges that are actually incurred and are related to the cost of shipping and handling</li>
          <ul className="list-[circle] ml-5">
            <li>Actual cost paid to the shipping service</li>
            <li>Handling costs, including packaging materials and insurance</li>
            <li>Cost of delivery confirmation or extra services</li>
          </ul>
          <li>Follow any category restrictions for maximum shipping costs</li>
          <li>Upload accurate tracking details</li>
          <li>Mark the item "shipped" once it has been sent</li>
        </ul>
        <h3 className="mt-4 font-bold">Sellers must not:</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm">
          <li>Use a slower shipping service than selected</li>
          <li>Include extra handling fees with free shipping</li>
          <li>Delay shipment once payout has been initiated</li>
        </ul>
      </div>
    )
  }
  
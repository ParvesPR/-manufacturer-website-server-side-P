orders.map((order, index) => <tr>
    <th className="bg-blue-200 text-black">{index + 1}</th>
    <td>{order.email}</td>
    <td className="bg-blue-200 text-black">{order.productName}</td>
    <td>{order.quantity}</td>
    <td>{order.price}</td>
    <td className="bg-blue-200 text-black">
        {(order.price && !order.paid) && <Link to={`/dashboard/payment/${order._id}`}><button className="btn btn-xs btn-success">Pay</button></Link>}
        {(order.price && order.paid) && <div>

            <p><span className="text-green-600">Paid</span></p>
            <p>TransactionId: <span>{order.transactionId}</span></p>
        </div>}
    </td>
    <td>


        {!order.paid && <button onClick={() => handleCancelOrder(email)} className="btn btn-xs btn-error">Cancel</button>}
    </td>
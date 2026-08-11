import React, { useState, useEffect } from "react";
import { useTheme } from "../../context/ThemeContext";
import { FaTrash } from "react-icons/fa"; // Import the icon

const NewBilling = () => {
    const { isDarkMode } = useTheme();
    const [items, setItems] = useState([
        { id: 1, qty: 0, price: 0, discount: 0, tax: 0, amount: 0 },
    ]);
    const [total, setTotal] = useState(0);
    const [overallDiscount, setOverallDiscount] = useState(0);
    const [overallTax, setOverallTax] = useState(0);
    const [deviceType, setDeviceType] = useState("");
    const [models, setModels] = useState([]);

    const inputClass = `p-2 border rounded ${
        isDarkMode
            ? "bg-gray-700 border-gray-600 text-white"
            : "bg-white border-gray-300 text-black"
    }`;

    const addItem = () => {
        setItems([
            ...items,
            {
                id: items.length + 1,
                qty: 0,
                price: 0,
                discount: 0,
                tax: 0,
                amount: 0,
            },
        ]);
    };

    const removeItem = (index) => {
        const newItems = items.filter((_, i) => i !== index);
        setItems(newItems);
        calculateTotal(newItems);
    };

    const handleItemChange = (index, field, value) => {
        const newItems = [...items];
        newItems[index][field] = value;
        newItems[index].amount = calculateAmount(newItems[index]);
        setItems(newItems);
        calculateTotal(newItems);
    };

    const calculateAmount = (item) => {
        const discountAmount = (item.price * item.qty * item.discount) / 100;
        const taxAmount =
            ((item.price * item.qty - discountAmount) * item.tax) / 100;
        return item.price * item.qty - discountAmount + taxAmount;
    };

    const calculateTotal = (items) => {
        const subtotal = items.reduce((acc, item) => acc + item.amount, 0);
        const discountAmount = (subtotal * overallDiscount) / 100;
        const taxAmount = ((subtotal - discountAmount) * overallTax) / 100;
        setTotal(subtotal - discountAmount + taxAmount);
    };

    useEffect(() => {
        calculateTotal(items);
    }, [overallDiscount, overallTax, items]);

    const handleOverallDiscountChange = (value) => {
        setOverallDiscount(value);
    };

    const handleOverallTaxChange = (value) => {
        setOverallTax(value);
    };

    const handleDeviceTypeChange = (value) => {
        setDeviceType(value);
        switch (value) {
            case "iphone":
                setModels([
                    "iPhone 12",
                    "iPhone 12 Pro",
                    "iPhone 13",
                    "iPhone 13 Pro",
                ]);
                break;
            case "ipad":
                setModels(["iPad Air", "iPad Pro", "iPad Mini"]);
                break;
            case "iwatch":
                setModels(["Apple Watch Series 6", "Apple Watch SE"]);
                break;
            case "macbook":
                setModels(["MacBook Air", "MacBook Pro"]);
                break;
            case "android":
                setModels(["Samsung Galaxy S21", "Google Pixel 6"]);
                break;
            case "laptop":
                setModels(["Dell XPS 13", "HP Spectre x360"]);
                break;
            default:
                setModels([]);
        }
    };

    return (
        <div
            style={{ maxWidth: "calc(100vw - 120px)" }}
            className={`p-6 min-h-screen ${
                isDarkMode ? "bg-gray-800 text-white" : "bg-gray-100 text-black"
            }`}
        >
            <h1 className="text-2xl font-semibold mb-4">Sale Order</h1>

            {/* Customer Info Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                <input
                    type="text"
                    placeholder="Customer Name"
                    className={inputClass}
                />
                <input
                    type="text"
                    placeholder="Phone No."
                    className={inputClass}
                />
                <input
                    type="text"
                    placeholder="alternate Phone No."
                    className={inputClass}
                />
                <select
                    className={inputClass}
                    value={deviceType}
                    onChange={(e) => handleDeviceTypeChange(e.target.value)}
                >
                    <option value="">Select Device Type</option>
                    <option value="iphone">iPhone</option>
                    <option value="ipad">iPad</option>
                    <option value="iwatch">iWatch</option>
                    <option value="macbook">MacBook</option>
                    <option value="android">Android</option>
                    <option value="laptop">Laptop</option>
                </select>
                <select className={inputClass}>
                    <option value="">Select Model</option>
                    {models.map((model, index) => (
                        <option key={index} value={model}>
                            {model}
                        </option>
                    ))}
                </select>
                <input
                    type="text"
                    placeholder="IMEI No."
                    className={inputClass}
                />
                <input
                    type="text"
                    placeholder="Serial No."
                    className={inputClass}
                />
                <input
                    type="text"
                    placeholder="Ticker No"
                    className={inputClass}
                />
            </div>

            {/* Items Table */}
            <table className="border-collapse border mb-6">
                <thead
                    className={` ${isDarkMode ? "bg-gray-700" : "bg-gray-200"}`}
                >
                    <tr>
                        <th className="border p-1">Item</th>
                        <th className="border p-2">Issue.</th>
                        <th className="border p-2">Description</th>
                        <th className="border p-2" style={{ maxWidth: "40px" }}>Qty</th>
                        <th className="border p-2">Unit</th>
                        <th className="border p-2">Price/Unit</th>
                        <th className="border p-2">Discount</th>
                        <th className="border p-2">Tax</th>
                        <th className="border p-2">Amount</th>
                        <th className="border p-2">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={item.id}>
                            <td className="border p-2">{index + 1}</td>
                            <td className="border p-2">
                                <select
                                    className={`p-1 border ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                >
                                    <option value="">Select Issue</option>
                                    <option value="water_damage">Water Damage</option>
                                    <option value="physical_damage">Physical Damage</option>
                                    <option value="display_replacement">Display Replacement</option>
                                    <option value="battery_change">Battery Change</option>
                                    <option value="wifi_network_issue">WiFi/Network Issue</option>
                                    <option value="storage_upgrade">Storage Upgrade</option>
                                    <option value="dead">Dead</option>
                                    <option value="restart_issue">Restart Issue</option>
                                    <option value="charging_issue">Charging Issue</option>
                                </select>
                            </td>
                            <td className="border p-2">
                                <input
                                    type="text"
                                    className={`p-1 border ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                />
                            </td>
                            <td className="border p-2">
                                <input
                                    style={{ maxWidth: "60px" }}
                                    type="number"
                                    className={`p-1 border ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                    value={item.qty}
                                    onChange={(e) =>
                                        handleItemChange(
                                            index,
                                            "qty",
                                            parseFloat(e.target.value) || 0
                                        )
                                    }
                                />
                            </td>
                            <td className="border p-2">
                                <select
                                    className={`p-1 border ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                >
                                    <option>None</option>
                                </select>
                            </td>
                            <td className="border p-2" style={{ width: "10%" }}>
                                <input
                                    style={{ maxWidth: "100%" }}
                                    type="number"
                                    className={`p-1 border ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                    value={item.price}
                                    onChange={(e) =>
                                        handleItemChange(
                                            index,
                                            "price",
                                            parseFloat(e.target.value) || 0
                                        )
                                    }
                                />
                            </td>
                            <td className="border p-2" style={{ width: "10%" }}>
                                <input
                                    type="number"
                                    className={`p-1 border ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                    value={item.discount}
                                    onChange={(e) =>
                                        handleItemChange(
                                            index,
                                            "discount",
                                            parseFloat(e.target.value) || 0
                                        )
                                    }
                                />
                            </td>
                            <td className="border p-2">
                                <select
                                    className={`p-1 border ${
                                        isDarkMode
                                            ? "bg-gray-700 border-gray-600 text-white"
                                            : "bg-white border-gray-300 text-black"
                                    }`}
                                    value={item.tax}
                                    onChange={(e) =>
                                        handleItemChange(
                                            index,
                                            "tax",
                                            parseFloat(e.target.value) || 0
                                        )
                                    }
                                >
                                    <option value={0}>Select</option>
                                    <option value={9}>9%</option>
                                    <option value={18}>18%</option>
                                </select>
                            </td>
                            <td className="border p-2">
                                {item.amount.toFixed(2)}
                            </td>
                            <td className="border p-2">
                                <button
                                    onClick={() => removeItem(index)}
                                    className="bg-red-500 text-white px-2 py-1 rounded"
                                >
                                    <FaTrash /> {/* Use the icon here */}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div className="flex justify-end mb-4">
                <button
                    onClick={addItem}
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                >
                    Add Item
                </button>
            </div>

            {/* Additional Details Section */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <input
                    type="text"
                    placeholder="Assets Received With The Device"
                    className={inputClass}
                />
                <input
                    type="text"
                    placeholder="Payment Type"
                    className={inputClass}
                />
                <input
                    type="text"
                    placeholder="Diagonostic Technitian"
                    className={inputClass}
                />
                <input
                    type="text"
                    placeholder="Colour"
                    className={inputClass}
                />
            </div>

            {/* Footer Section */}
            <div className="flex flex-col md:flex-row justify-between items-center mt-6">
                <div className="space-x-2 mb-4 md:mb-0">
                    <button className="bg-blue-500 text-white px-4 py-2 rounded">
                        Share
                    </button>
                    <button className="bg-green-500 text-white px-4 py-2 rounded">
                        Save
                    </button>
                </div>
                <div className="flex items-center">
                    <span className="mr-2">Discount:</span>
                    <input
                        type="number"
                        className={`p-1 border rounded w-20 ${
                            isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-black"
                        }`}
                        value={overallDiscount}
                        onChange={(e) =>
                            handleOverallDiscountChange(
                                parseFloat(e.target.value) || 0
                            )
                        }
                    />
                    <span className="ml-4 mr-2">Tax:</span>
                    <select
                        className={`p-1 border rounded ${
                            isDarkMode
                                ? "bg-gray-700 border-gray-600 text-white"
                                : "bg-white border-gray-300 text-black"
                        }`}
                        value={overallTax}
                        onChange={(e) =>
                            handleOverallTaxChange(
                                parseFloat(e.target.value) || 0
                            )
                        }
                    >
                        <option value={0}>None</option>
                        <option value={9}>9%</option>
                        <option value={18}>18%</option>
                    </select>
                    <span className="ml-4">Total: {total.toFixed(2)}</span>
                </div>
            </div>
        </div>
    );
};

export default NewBilling;

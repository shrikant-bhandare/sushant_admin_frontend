import React, { useState, useEffect } from 'react';
import { FaTrash, FaSearch } from 'react-icons/fa';
import debounce from 'lodash.debounce';
import { getDeviceTypes, getDeviceModels } from '../../services/InventoryService';

// ── Constants ────────────────────────────────────────────────────────────────
const STATUS_OPTIONS = ['open', 'New', 'In Progress', 'preDiagnosed', 'ConvertToSale', 'Completed', 'Paid', 'deleted'];

const ISSUE_OPTIONS = [
  { value: 'water_damage', label: 'Water Damage' },
  { value: 'physical_damage', label: 'Physical Damage' },
  { value: 'display_replacement', label: 'Display Replacement' },
  { value: 'battery_change', label: 'Battery Change' },
  { value: 'wifi_network_issue', label: 'WiFi/Network Issue' },
  { value: 'storage_upgrade', label: 'Storage Upgrade' },
  { value: 'dead', label: 'Dead' },
  { value: 'restart_issue', label: 'Restart Issue' },
  { value: 'charging_issue', label: 'Charging Issue' },
];

const COLOR_OPTIONS = [
  { value: 'black', label: 'Black' },
  { value: 'white', label: 'White' },
  { value: 'blue', label: 'Blue' },
  { value: 'green', label: 'Green' },
  { value: 'yellow', label: 'Yellow' },
  { value: 'pink', label: 'Pink' },
  { value: 'purple', label: 'Purple' },
  { value: 'red', label: 'Product(RED)' },
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'space_gray', label: 'Space Gray' },
  { value: 'midnight', label: 'Midnight' },
  { value: 'starlight', label: 'Starlight' },
  { value: 'deep_purple', label: 'Deep Purple' },
  { value: 'graphite', label: 'Graphite' },
  { value: 'pacific_blue', label: 'Pacific Blue' },
  { value: 'sierra_blue', label: 'Sierra Blue' },
  { value: 'alpine_green', label: 'Alpine Green' },
  { value: 'natural_titanium', label: 'Natural Titanium' },
  { value: 'blue_titanium', label: 'Blue Titanium' },
  { value: 'white_titanium', label: 'White Titanium' },
  { value: 'black_titanium', label: 'Black Titanium' },
  { value: 'coral', label: 'Coral' },
  { value: 'rose_gold', label: 'Rose Gold' },
  { value: 'jet_black', label: 'Jet Black' },
  { value: 'slate', label: 'Slate' },
];

// ── Helper: resolve populated ObjectId refs ──────────────────────────────────
const resolveId = (val) => (!val ? '' : typeof val === 'object' ? (val._id || '') : val);

// ── Main Component ────────────────────────────────────────────────────────────
/**
 * AdminUpdateOrderModal
 * Edit Order tab mirrors the NewSaleOrder form exactly.
 * Change History tab shows full audit log from backend.
 * updatedAt is NEVER sent in the payload (auto-managed by MongoDB).
 */
const AdminUpdateOrderModal = ({ order, onClose, onUpdated }) => {
  const [activeTab, setActiveTab] = useState('edit');
  const [saving, setSaving] = useState(false);

  // ── Device dropdowns ─────────────────────────────────────────────────────
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [deviceModels, setDeviceModels] = useState([]);
  const [deviceType, setDeviceType] = useState(resolveId(order.deviceBrand));

  // ── Audit log ────────────────────────────────────────────────────────────
  const [auditLogs, setAuditLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);

  // ── Customer search ──────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // ── Issue search inputs (per row) ────────────────────────────────────────
  const [issueSearchInputs, setIssueSearchInputs] = useState([]);

  // ── Totals ───────────────────────────────────────────────────────────────
  const [subtotal, setSubtotal] = useState(0);

  // ── Form state ───────────────────────────────────────────────────────────
  const [formData, setFormData] = useState({
    customerName: order.customerName || '',
    phone: order.phone || '',
    alternatePhone: order.alternatePhone || '',
    address: order.address || '',
    gstNumber: order.gstNumber || '',
    serialNumber: order.serialNumber || '',
    imeiNumber: order.imeiNumber || '',
    color: order.color || '',
    model: resolveId(order.model),
    date: order.date ? new Date(order.date).toISOString().split('T')[0] : '',
    technicianName: order.technicianName || '',
    paymentType: order.paymentType || '',
    preDiagnosed: order.preDiagnosed || '',
    assetsReceived: order.assetsReceived || '',
    status: order.status || 'open',
    discountPercentage: order.discount || 0,
    discountAmount: 0,
    advanced: order.advanced || 0,
    balance: order.balance || 0,
    department: order.department || '',
  });

  const [items, setItems] = useState(
    (order.items || []).map((item, idx) => ({
      _localId: idx,
      issue: item.issue || '',
      description: item.description || '',
      qty: item.quantity || 1,
      price: item.pricePerUnit || 0,
      pricePerUnit: item.pricePerUnit || 0,
      tax: item.tax || 0,
      amount: item.amount || 0,
      discount: item.discount || 0,
      warranty: item.warranty || '',
      serialNumber: item.serialNumber || '',
      unit: item.unit || 'pcs',
    }))
  );

  // ── Input style (matches NewSaleOrder) ───────────────────────────────────
  const inputClass = 'p-2 border rounded w-full shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm bg-white border-gray-300 text-black';
  const selectClass = 'p-2 border rounded w-full shadow-sm focus:ring-2 focus:ring-purple-500 focus:outline-none text-sm bg-white border-gray-300 text-black';

  // ── Sync issueSearchInputs length with items ─────────────────────────────
  useEffect(() => {
    setIssueSearchInputs(prev => items.map((_, i) => prev[i] || ''));
  }, [items.length]);

  // ── Device types ─────────────────────────────────────────────────────────
  useEffect(() => {
    getDeviceTypes()
      .then(res => setDeviceTypes(res?.data?.deviceTypes || []))
      .catch(() => setDeviceTypes([]));
  }, []);

  // ── Device models (when brand changes) ───────────────────────────────────
  useEffect(() => {
    if (!deviceType) { setDeviceModels([]); return; }
    getDeviceModels(deviceType)
      .then(res => setDeviceModels(res?.data?.deviceModels || res?.data?.models || []))
      .catch(() => setDeviceModels([]));
  }, [deviceType]);

  // ── Audit logs ────────────────────────────────────────────────────────────
  const loadAuditLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APIURL}/api/sale-orders/${order._id}/logs`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
      );
      const data = await res.json();
      if (data.success) setAuditLogs(data.data);
    } catch (e) {
      console.error('Failed to load logs', e);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') loadAuditLogs();
  }, [activeTab]);

  // ── Item calculations (mirrors NewSaleOrder logic) ────────────────────────
  const calculateAmount = (item) => {
    const taxAmount = (item.price * item.tax) / 100;
    return item.price + taxAmount;
  };

  const calculatePriceFromAmount = (amount, tax) => {
    if (tax === 0) return amount;
    return +(amount / (1 + tax / 100)).toFixed(2);
  };

  const calculateTotal = (currentItems, currentFormData) => {
    const sub = currentItems.reduce((acc, item) => acc + (parseFloat(item.amount) || 0), 0);
    const discountPct = parseFloat(currentFormData.discountPercentage) || 0;
    const discountAmt = parseFloat(currentFormData.discountAmount) || 0;
    let finalDiscount = 0;
    if (discountPct > 0) {
      finalDiscount = parseFloat(((sub * discountPct) / 100).toFixed(2));
    } else if (discountAmt > 0) {
      finalDiscount = discountAmt;
    }
    const finalTotal = sub - finalDiscount;
    const advanced = parseFloat(currentFormData.advanced) || 0;
    const balance = parseFloat((finalTotal - advanced).toFixed(2));
    setSubtotal(sub);
    setFormData(prev => ({ ...prev, discountAmount: finalDiscount, balance }));
  };

  // recalc whenever discount/advanced/items change
  useEffect(() => {
    calculateTotal(items, formData);
  }, [formData.discountPercentage, formData.advanced, items]);

  // ── Item row change ───────────────────────────────────────────────────────
  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    if (['qty', 'price', 'discount', 'tax', 'amount', 'pricePerUnit'].includes(field)) {
      newItems[index][field] = value;
    } else {
      newItems[index][field] = value;
    }

    const parsedItem = {
      ...newItems[index],
      price: parseFloat(newItems[index].price) || 0,
      tax: parseFloat(newItems[index].tax) || 0,
      amount: parseFloat(newItems[index].amount) || 0,
    };

    if (field === 'price' || field === 'tax') {
      newItems[index].amount = calculateAmount(parsedItem);
      newItems[index].pricePerUnit = newItems[index].price;
    } else if (field === 'amount') {
      newItems[index].price = calculatePriceFromAmount(parsedItem.amount, parsedItem.tax);
      newItems[index].pricePerUnit = newItems[index].price;
    }

    setItems(newItems);
    calculateTotal(newItems, formData);
  };

  const addItem = () => {
    setItems(prev => [
      ...prev,
      { _localId: Date.now(), issue: '', description: '', qty: 0, price: 0, pricePerUnit: 0, discount: 0, tax: 0, amount: 0, warranty: '', serialNumber: '', unit: 'pcs' },
    ]);
  };

  const removeItem = (index) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    calculateTotal(newItems, formData);
  };

  // ── Form field change ─────────────────────────────────────────────────────
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // ── Customer search (debounced) ───────────────────────────────────────────
  const doSearch = debounce(async (query) => {
    if (!query) { setSearchResults([]); return; }
    setIsSearching(true);
    const isPhone = /^\d+$/.test(query);
    const param = isPhone ? `phoneNumber=${query}` : `name=${query}`;
    try {
      const res = await fetch(
        `${import.meta.env.VITE_APIURL}/api/customers/search?${param}`,
        { headers: { Authorization: `Bearer ${localStorage.getItem('accessToken')}` } }
      );
      const data = await res.json();
      if (data.statusCode === 200) setSearchResults(data.data);
    } catch (e) {
      console.error('Search error', e);
    } finally {
      setIsSearching(false);
    }
  }, 500);

  const handleCustomerSelect = async (customer) => {
    setFormData(prev => ({
      ...prev,
      customerName: customer.name,
      phone: customer.phoneNumber,
      alternatePhone: customer.alternativePhoneNumber || '',
      gstNumber: customer.gstNumber || '',
      address: customer.address || '',
    }));
    const devices = customer.devices || [];
    if (devices.length > 0) {
      const d = devices[0];
      setDeviceType(d.deviceType || '');
      setFormData(prev => ({ ...prev, imeiNumber: d.imei || '', serialNumber: d.serialNumber || '', model: d.deviceModel || '' }));
      try {
        const res = await getDeviceModels(d.deviceType);
        setDeviceModels(res?.data?.deviceModels || res?.data?.models || []);
      } catch {}
    }
    setSearchResults([]);
    setSearchQuery('');
  };

  // ── Change diffing ────────────────────────────────────────────────────────
  const computeChanges = () => {
    const changes = {};
    const SCALARS = [
      'customerName', 'phone', 'alternatePhone', 'address', 'gstNumber',
      'serialNumber', 'imeiNumber', 'color', 'date', 'technicianName',
      'paymentType', 'preDiagnosed', 'assetsReceived', 'status', 'department',
    ];
    SCALARS.forEach(field => {
      const oldVal = order[field] ?? '';
      const newVal = formData[field] ?? '';
      if (String(oldVal) !== String(newVal)) {
        changes[field] = { from: oldVal, to: newVal };
      }
    });
    const numFields = [['discount', formData.discountPercentage], ['advanced', formData.advanced], ['balance', formData.balance]];
    numFields.forEach(([k, nv]) => {
      const ov = parseFloat(order[k]) || 0;
      if (ov !== (parseFloat(nv) || 0)) changes[k] = { from: ov, to: parseFloat(nv) || 0 };
    });
    const oldBrand = resolveId(order.deviceBrand);
    if (oldBrand !== deviceType) changes.deviceBrand = { from: oldBrand, to: deviceType };
    const oldModel = resolveId(order.model);
    if (oldModel !== formData.model) changes.model = { from: oldModel, to: formData.model };
    const oldItemsJson = JSON.stringify((order.items || []).map(({ _id, __v, ...r }) => r));
    const newItemsJson = JSON.stringify(items.map(({ _localId, ...r }) => r));
    if (oldItemsJson !== newItemsJson) changes.items = { from: `${(order.items || []).length} item(s)`, to: `${items.length} item(s) (modified)` };
    return changes;
  };

  // ── Save ──────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      const changes = computeChanges();
      const payload = {
        ...formData,
        deviceBrand: deviceType,
        discount: parseFloat(formData.discountPercentage) || 0,
        advanced: parseFloat(formData.advanced) || 0,
        balance: parseFloat(formData.balance) || 0,
        total: subtotal - (parseFloat(formData.discountAmount) || 0),
        items: items.map(({ _localId, qty, price, ...rest }) => ({
          ...rest,
          quantity: parseFloat(qty) || 0,
          pricePerUnit: parseFloat(price || rest.pricePerUnit) || 0,
        })),
      };
      // Never send auto-managed fields
      delete payload.updatedAt;
      delete payload.createdAt;
      delete payload._id;
      delete payload.ticketNumber;
      delete payload.discountPercentage;
      delete payload.discountAmount;

      const res = await fetch(
        `${import.meta.env.VITE_APIURL}/api/sale-orders/${order._id}`,
        {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${localStorage.getItem('accessToken')}` },
          body: JSON.stringify(payload),
        }
      );
      const result = await res.json();
      if (result.success) {
        onUpdated({ ticketNumber: order.ticketNumber, changes, timestamp: new Date() });
      } else {
        alert('Failed to update: ' + result.message);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── Status badge color ────────────────────────────────────────────────────
  const statusBadge = (s) => {
    switch (s?.toLowerCase()) {
      case 'new': return 'bg-blue-100 text-blue-800';
      case 'in progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'paid': return 'bg-emerald-100 text-emerald-800';
      case 'deleted': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // ── Audit log helpers ─────────────────────────────────────────────────────
  const actionBorder = a => ({ UPDATE: 'border-blue-200 bg-blue-50', CREATE: 'border-green-200 bg-green-50', DELETE: 'border-red-200 bg-red-50', RETURN: 'border-red-200 bg-red-50' }[a] || 'border-gray-200 bg-gray-50');
  const actionBadge = a => ({ UPDATE: 'bg-blue-200 text-blue-800', CREATE: 'bg-green-200 text-green-800', DELETE: 'bg-red-200 text-red-800', RETURN: 'bg-red-200 text-red-800' }[a] || 'bg-gray-200 text-gray-700');
  const fmtDate = d => { try { return new Date(d).toLocaleString('en-IN'); } catch { return d; } };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[97vh] flex flex-col">

        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50 rounded-t-xl flex-shrink-0">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Edit Service Order</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-gray-500 font-mono bg-gray-100 px-2 py-0.5 rounded">{order.ticketNumber}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusBadge(order.status)}`}>{order.status}</span>
                <span className="text-xs text-gray-400">{order.customerName}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-200 rounded-lg p-1">
              {[['edit', '✏️ Edit Order'], ['history', '📋 Change History']].map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${activeTab === tab ? 'bg-white text-gray-800 shadow' : 'text-gray-600 hover:text-gray-800'}`}>
                  {label}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold leading-none ml-1">×</button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'edit' ? (
            <div className="p-5 pb-24 text-sm">

              {/* Customer Search */}
              <div className="mb-4">
                <label className="font-medium block mb-1 text-sm">Search Customer</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or phone number"
                    className={`${inputClass} pr-10`}
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); doSearch(e.target.value); }}
                  />
                  <FaSearch className="absolute right-3 top-3 text-gray-400" />
                </div>
                {isSearching && <p className="text-xs text-gray-500 mt-1">Searching...</p>}
                {searchResults.length > 0 && (
                  <ul className="border rounded mt-1 bg-white shadow-lg max-h-32 overflow-y-auto z-10 relative">
                    {searchResults.map((c) => (
                      <li key={c._id} className="p-2 hover:bg-gray-100 cursor-pointer text-xs"
                        onClick={() => handleCustomerSelect(c)}>
                        Name: {c.name} &nbsp;|&nbsp; Phone: {c.phoneNumber}{c.alternativePhoneNumber ? `, ${c.alternativePhoneNumber}` : ''}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* Ticket Number (read-only) */}
              <div className="grid grid-cols-8 mb-4">
                <label className="font-medium col-span-2 text-sm self-center">Ticket No</label>
                <input type="text" value={order.ticketNumber || ''} disabled
                  className="p-2 border rounded col-span-2 bg-gray-200 cursor-not-allowed text-sm text-gray-600" />
              </div>

              {/* Customer + Device Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-4">
                <div>
                  <label className="font-medium block mb-1 text-sm">Consumer Name</label>
                  <input type="text" name="customerName" placeholder="Consumer Name" className={inputClass}
                    value={formData.customerName} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="font-medium block mb-1 text-sm">Phone No.</label>
                  <input type="text" name="phone" placeholder="Phone No." className={inputClass}
                    value={formData.phone} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="font-medium block mb-1 text-sm">Alternate Phone No.</label>
                  <input type="text" name="alternatePhone" placeholder="Alternate Phone No." className={inputClass}
                    value={formData.alternatePhone} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="font-medium block mb-1 text-sm">Device Type</label>
                  <select className={selectClass} value={deviceType}
                    onChange={(e) => { setDeviceType(e.target.value); setFormData(prev => ({ ...prev, model: '' })); }}>
                    <option value="">Select Device Type</option>
                    {deviceTypes.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-medium block mb-1 text-sm">Model</label>
                  <select name="model" className={selectClass} value={formData.model} onChange={handleInputChange}>
                    <option value="">Select Model</option>
                    {deviceModels.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="font-medium block mb-1 text-sm">IMEI No.</label>
                  <input type="text" name="imeiNumber" placeholder="IMEI No." className={inputClass}
                    value={formData.imeiNumber} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="font-medium block mb-1 text-sm">Serial No.</label>
                  <input type="text" name="serialNumber" placeholder="Serial No." className={inputClass}
                    value={formData.serialNumber} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="font-medium block mb-1 text-sm">GST No.</label>
                  <input type="text" name="gstNumber" placeholder="GST No." className={inputClass}
                    value={formData.gstNumber} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="font-medium block mb-1 text-sm">Address</label>
                  <input type="text" name="address" placeholder="Address" className={inputClass}
                    value={formData.address} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="font-medium block mb-1 text-sm">Date</label>
                  <input type="date" name="date" className={inputClass}
                    value={formData.date} onChange={handleInputChange} />
                </div>
                <div>
                  <label className="font-medium block mb-1 text-sm">Status</label>
                  <select name="status" className={selectClass} value={formData.status} onChange={handleInputChange}>
                    {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              {/* Items Table */}
              <div className="mb-4 overflow-auto rounded-lg shadow border bg-white p-4">
                <table className="border rounded-lg w-full">
                  <thead className="bg-purple-400 text-white">
                    <tr>
                      <th className="border p-1 text-sm">Item</th>
                      <th className="border p-1 text-sm">Issue</th>
                      <th className="border p-1 text-sm">Description</th>
                      <th className="border p-1 text-sm">Warranty</th>
                      <th className="border p-1 text-sm">Price/Unit</th>
                      <th className="border p-1 text-sm">Tax</th>
                      <th className="border p-1 text-sm">Amount</th>
                      <th className="border p-1 text-sm">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item._localId ?? index}>
                        <td className="border p-1 text-sm text-center">{index + 1}</td>
                        {/* Issue with datalist */}
                        <td className="border p-1">
                          <input
                            type="text"
                            className={inputClass}
                            placeholder="Type or select issue"
                            value={(() => {
                              const m = ISSUE_OPTIONS.find(o => o.value === item.issue);
                              return m ? m.label : (item.issue || '');
                            })()}
                            onChange={e => {
                              const v = e.target.value;
                              setIssueSearchInputs(prev => { const a = [...prev]; a[index] = v; return a; });
                              handleItemChange(index, 'issue', v);
                            }}
                            onBlur={e => {
                              const v = e.target.value;
                              const m = ISSUE_OPTIONS.find(o => o.label.toLowerCase() === v.toLowerCase());
                              handleItemChange(index, 'issue', m ? m.value : v);
                            }}
                            list={`issue-opts-${index}`}
                            autoComplete="off"
                          />
                          <datalist id={`issue-opts-${index}`}>
                            {(issueSearchInputs[index]
                              ? ISSUE_OPTIONS.filter(o => o.label.toLowerCase().includes((issueSearchInputs[index] || '').toLowerCase()))
                              : ISSUE_OPTIONS
                            ).map(o => <option key={o.value} value={o.label} />)}
                          </datalist>
                        </td>
                        {/* Description */}
                        <td className="border p-1">
                          <input type="text" className={inputClass} value={item.description || ''}
                            onChange={e => handleItemChange(index, 'description', e.target.value)} />
                        </td>
                        {/* Warranty */}
                        <td className="border p-2">
                          <select className={inputClass} value={item.warranty || ''}
                            onChange={e => handleItemChange(index, 'warranty', e.target.value)}>
                            <option value="N/A">Select Warranty</option>
                            <option value="1_month">1 Month</option>
                            <option value="3_months">3 Months</option>
                            <option value="6_months">6 Months</option>
                            <option value="12_months">12 Months</option>
                          </select>
                        </td>
                        {/* Price/Unit */}
                        <td className="border p-2" style={{ width: '10%' }}>
                          <input type="number" className={inputClass} style={{ maxWidth: '100%' }}
                            value={item.pricePerUnit || 0}
                            onChange={e => handleItemChange(index, 'price', e.target.value)} />
                        </td>
                        {/* Tax */}
                        <td className="border p-2">
                          <select className={inputClass} value={item.tax}
                            onChange={e => handleItemChange(index, 'tax', e.target.value)}>
                            <option value={0}>Select</option>
                            <option value={9}>9%</option>
                            <option value={12}>12%</option>
                            <option value={18}>18%</option>
                          </select>
                        </td>
                        {/* Amount */}
                        <td className="border p-2">
                          <input type="number" className={inputClass} style={{ maxWidth: '100%' }}
                            value={item.amount || 0}
                            onChange={e => handleItemChange(index, 'amount', e.target.value)} />
                        </td>
                        {/* Delete */}
                        <td className="border p-2 text-center">
                          <button onClick={() => removeItem(index)}
                            className="bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600">
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 w-full flex justify-end">
                  <button onClick={addItem}
                    className="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded">
                    Add Item
                  </button>
                </div>
              </div>

              {/* Additional Details Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <input type="text" name="assetsReceived" placeholder="Assets Received With The Device"
                  className={inputClass} value={formData.assetsReceived} onChange={handleInputChange} />
                <select name="paymentType" className={selectClass} value={formData.paymentType} onChange={handleInputChange}>
                  <option value="">Select Payment Type</option>
                  <option value="UPI">UPI</option>
                  <option value="Cash">Cash</option>
                  <option value="Cash + UPI">Cash + UPI</option>
                  <option value="Paytm">Paytm</option>
                  <option value="GPay">GPay</option>
                  <option value="Card">Card</option>
                </select>
                <input type="text" name="technicianName" placeholder="Diagnostic Technician"
                  className={inputClass} value={formData.technicianName} onChange={handleInputChange} />
                {/* Color with COLOR_OPTIONS datalist */}
                <div>
                  <input
                    type="text"
                    name="color"
                    placeholder="Type or select color"
                    className={inputClass}
                    value={(() => { const m = COLOR_OPTIONS.find(o => o.value === formData.color); return m ? m.label : (formData.color || ''); })()}
                    onChange={e => setFormData(prev => ({ ...prev, color: e.target.value }))}
                    onBlur={e => {
                      const v = e.target.value;
                      const m = COLOR_OPTIONS.find(o => o.label.toLowerCase() === v.toLowerCase());
                      setFormData(prev => ({ ...prev, color: m ? m.value : v }));
                    }}
                    list="admin-color-options"
                    autoComplete="off"
                  />
                  <datalist id="admin-color-options">
                    {(formData.color
                      ? COLOR_OPTIONS.filter(o => o.label.toLowerCase().includes(formData.color.toLowerCase()))
                      : COLOR_OPTIONS
                    ).map(o => <option key={o.value} value={o.label} />)}
                  </datalist>
                </div>
              </div>

              {/* Financial Section */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div>
                  <label className="font-medium block mb-1 text-sm">Discount %</label>
                  <input type="number" step="0.01" name="discountPercentage" placeholder="Discount %"
                    className={inputClass}
                    value={formData.discountPercentage === 0 ? '' : formData.discountPercentage}
                    onChange={e => setFormData(prev => ({ ...prev, discountPercentage: e.target.value, discountAmount: 0 }))} />
                </div>
                <div>
                  <label className="font-medium block mb-1 text-sm">Discount Amount</label>
                  <input type="number" step="0.01" name="discountAmount" placeholder="Discount Amount"
                    className={inputClass}
                    value={formData.discountAmount === 0 ? '' : formData.discountAmount}
                    onChange={e => setFormData(prev => ({ ...prev, discountAmount: e.target.value, discountPercentage: 0 }))} />
                </div>
                <div>
                  <label className="font-medium block mb-1 text-sm">Advanced</label>
                  <input type="number" step="0.01" name="advanced" placeholder="Advanced Payment"
                    className={inputClass}
                    value={formData.advanced === 0 ? '' : formData.advanced}
                    onChange={e => setFormData(prev => ({ ...prev, advanced: e.target.value }))} />
                </div>
                <div>
                  <label className="font-medium block mb-1 text-sm">Balance</label>
                  <input type="number" step="0.01" name="balance" placeholder="Balance"
                    className={`${inputClass} bg-gray-100 cursor-not-allowed`}
                    value={formData.balance || 0} readOnly />
                </div>
              </div>

              {/* Totals summary */}
              <div className="flex justify-end items-center mt-4">
                <div className="text-right text-sm text-gray-600 space-y-0.5">
                  <div>Subtotal: <span className="font-medium">{(subtotal || 0).toFixed(2)}</span></div>
                  <div>Discount: <span className="font-medium">{(parseFloat(formData.discountAmount) || 0).toFixed(2)}</span></div>
                  <div>Advanced: <span className="font-medium">{(parseFloat(formData.advanced) || 0).toFixed(2)}</span></div>
                  <div className="font-bold text-gray-800 text-base">Balance: {(formData.balance || 0).toFixed(2)}</div>
                </div>
              </div>

              {/* Read-only system fields */}
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-amber-700 uppercase tracking-wider mb-2">⚙️ System Fields (Read-only)</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-xs text-gray-600">
                  <div><span className="font-medium">Ticket #:</span> <span className="font-mono text-blue-700">{order.ticketNumber}</span></div>
                  <div><span className="font-medium">Created At:</span> {fmtDate(order.createdAt)}</div>
                  <div className="text-amber-700 font-medium">updatedAt — auto-managed by system</div>
                </div>
              </div>

            </div>
          ) : (
            /* History Tab */
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-gray-700">
                  Change History — <span className="text-blue-600">{order.ticketNumber}</span>
                </h3>
                <button onClick={loadAuditLogs}
                  className="px-3 py-1 bg-gray-200 text-gray-600 rounded text-xs hover:bg-gray-300">
                  🔄 Refresh
                </button>
              </div>
              {logsLoading ? (
                <div className="text-center py-10 text-gray-500">Loading history…</div>
              ) : auditLogs.length === 0 ? (
                <div className="text-center py-10 text-gray-400">No change history found for this order.</div>
              ) : (
                <div className="space-y-3">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className={`border rounded-lg p-4 ${actionBorder(log.action)}`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${actionBadge(log.action)}`}>{log.action}</span>
                        <span className="text-xs text-gray-500">{fmtDate(log.timestamp)}</span>
                      </div>
                      {log.action === 'UPDATE' && log.changes && (
                        <div className="space-y-0.5 mt-2">
                          {Object.entries(log.changes).filter(([k]) => !['__v'].includes(k)).map(([key, val]) => (
                            <div key={key} className="flex items-start text-xs">
                              <span className="font-semibold text-gray-700 w-32 flex-shrink-0">{key}:</span>
                              <span className="text-gray-600 break-all">
                                {key === 'items' ? `${Array.isArray(val) ? val.length : '?'} item(s)` : typeof val === 'object' ? JSON.stringify(val) : String(val)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                      {log.action !== 'UPDATE' && (
                        <p className="text-xs text-gray-500 mt-1">
                          {log.action === 'CREATE' && 'Order was created.'}
                          {log.action === 'DELETE' && 'Order was deleted/soft-deleted.'}
                          {log.action === 'RETURN' && 'Return was processed.'}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="border-t bg-white px-5 py-3 flex items-center justify-between flex-shrink-0 rounded-b-xl">
          <p className="text-xs text-gray-400">
            ⚠️ <code className="bg-gray-100 px-1 rounded">updatedAt</code> is auto-managed and never overwritten manually.
          </p>
          <div className="flex gap-3">
            <button onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm">
              Cancel
            </button>
            {activeTab === 'edit' && (
              <button onClick={handleSave} disabled={saving}
                className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm font-semibold disabled:opacity-50">
                {saving ? 'Saving…' : 'Save and Update'}
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminUpdateOrderModal;

'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import DashboardLayout from '@/components/dashboard/DashboardLayout';
import { apiRequest } from '@/lib/api';
import { showToast } from '@/components/ToastContainer';

export default function CreateInvoicePage() {  const searchParams = useSearchParams();
  const previewRef = useRef(null);

  // Company details (hardcoded as in original)
  const companyDetails = {
    name: 'FLAVOURHEAVEN LLP',
    address: 'P.NO.1/3, SY NO-64, SECTOR-1\nMadhapur, Serilingampally,\nHyderabad - 500081',
    phone: '94900 64222',
    email: 'flavourheavenllp@gmail.com',
    gst: '36AAJFF3855D1ZG'
  };

  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [customerDetails, setCustomerDetails] = useState({
    name: '',
    address: '',
    email: '',
    phone: '',
    gst: ''
  });

  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [sgstRate, setSgstRate] = useState(5);
  const [cgstRate, setCgstRate] = useState(5);
  const [paymentStatus, setPaymentStatus] = useState('PENDING');

  const [items, setItems] = useState([
    { id: 1, description: '', quantity: 1, price: 0, total: 0 }
  ]);

  const [bankDetails, setBankDetails] = useState(
    'Account Holder: FLAVOURHEAVEN LLP\nAccount Number: 50200088067094\nIFSC: HDFC0004277\nBranch: Madhapur, Main Road\nAccount Type: Current'
  );
  const [paymentTerms, setPaymentTerms] = useState('Please make payment via bank transfer within 7 days.');
  const [notes, setNotes] = useState('Thank you for your business!');

  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(true);

  const invoiceId = searchParams.get('invoices');

  useEffect(() => {
    const today = new Date();
    const due = new Date();
    due.setDate(today.getDate() + 7);

    const formatDate = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    setInvoiceDate(formatDate(today));
    setDueDate(formatDate(due));

    loadCustomers();
  }, []);

  useEffect(() => {
    if (invoiceId && customers.length > 0) {
      fetchInvoiceDetails();
    }
  }, [invoiceId, customers]);

  const loadCustomers = async () => {
    try {
      const data = await apiRequest('GET', 'customers/list');
      setCustomers(data.list || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      showToast('error', 'Error', 'Failed to load customers');
    }
  };

  const fetchInvoiceDetails = async () => {
    if (!invoiceId) return;

    setLoading(true);
    try {
      const data = await apiRequest('GET', `invoices/${invoiceId}`);

      if (data) {
        setInvoiceNumber(data.invoiceNumber);
        setInvoiceDate(data.dt);
        setDueDate(data.dueDate);
        setPaymentStatus(data.paymentStatus);

        if (data.items && data.items.length > 0) {
          const formattedItems = data.items.map((item, index) => ({
            id: index + 1,
            description: item.description || '',
            quantity: item.quantity || 1,
            price: item.price || 0,
            total: item.total || 0
          }));
          setItems(formattedItems);
        }

        if (data.customerId) {
          setSelectedCustomer(data.customerId);
          await fetchCustomerDetails(data.customerId);
        }
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      showToast('error', 'Error', 'Failed to load invoice details');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (customerId) => {
    try {
      const data = await apiRequest('GET', 'customers/list', { id: customerId });

      if (data && data.list && data.list.length > 0) {
        const customer = data.list[0];
        setCustomerDetails({
          name: customer.name || '',
          address: customer.billingAddress || '',
          email: customer.email || '',
          phone: customer.phone || '',
          gst: customer.gstnumber || ''
        });
      }
    } catch (error) {
      console.error('Error fetching customer:', error);
    }
  };

  const handleCustomerChange = (customerId) => {
    setSelectedCustomer(customerId);

    if (customerId) {
      const customer = customers.find(c => c.id === customerId);
      if (customer) {
        setCustomerDetails({
          name: customer.name || '',
          address: customer.billingAddress || '',
          email: customer.email || '',
          phone: customer.phone || '',
          gst: customer.gstnumber || ''
        });

        // Generate invoice number
        const today = new Date();
        const year = today.getFullYear().toString().substr(-2);
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const randomDigits = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        setInvoiceNumber(`INV-${customerId}-${year}${month}${day}-${randomDigits}`);
      }
    } else {
      setCustomerDetails({ name: '', address: '', email: '', phone: '', gst: '' });
      setInvoiceNumber('');
    }
  };

  const addItem = () => {
    const newId = Math.max(...items.map(i => i.id), 0) + 1;
    setItems([...items, { id: newId, description: '', quantity: 1, price: 0, total: 0 }]);
  };

  const deleteItem = (id) => {
    if (items.length === 1) {
      showToast('error', 'Error', 'You need at least one item');
      return;
    }
    setItems(items.filter(item => item.id !== id));
  };

  const updateItem = (id, field, value) => {
    const updatedItems = items.map(item => {
      if (item.id === id) {
        const newItem = { ...item, [field]: value };
        if (field === 'quantity' || field === 'price') {
          newItem.total = parseFloat(newItem.quantity || 0) * parseFloat(newItem.price || 0);
        }
        return newItem;
      }
      return item;
    });
    setItems(updatedItems);
  };

  const calculateTotals = () => {
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.total) || 0), 0);
    const sgstAmount = subtotal * (sgstRate / 100);
    const cgstAmount = subtotal * (cgstRate / 100);
    const total = subtotal + sgstAmount + cgstAmount;

    return { subtotal, sgstAmount, cgstAmount, total };
  };

  const { subtotal, sgstAmount, cgstAmount, total } = calculateTotals();

  const handleGenerateInvoice = async () => {
    // Validation
    if (!selectedCustomer) {
      showToast('error', 'Error', 'Please select a customer');
      return;
    }

    const hasValidItem = items.some(item => item.description.trim() !== '');
    if (!hasValidItem) {
      showToast('error', 'Error', 'Please add at least one item with a description');
      return;
    }

    const hasInvalidPrice = items.some(item => parseFloat(item.price) <= 0);
    if (hasInvalidPrice) {
      showToast('error', 'Error', 'All items must have a price greater than 0');
      return;
    }

    setLoading(true);

    try {
      // Dynamically import libraries
      const [html2canvasModule, jsPDFModule] = await Promise.all([
      ]);

      const html2canvas = html2canvasModule.default;
      const jsPDF = jsPDFModule.jsPDF;

      // Generate PDF
      const element = previewRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        logging: false,
        useCORS: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210;
      const imgHeight = canvas.height * imgWidth / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);

      const fileName = `${companyDetails.name.replace(/\s+/g, '-')}-${invoiceNumber.replace(/\s+/g, '-')}.pdf`;
      const pdfBlob = pdf.output('blob');

      // Download PDF
      const downloadLink = document.createElement('a');
      downloadLink.href = URL.createObjectURL(pdfBlob);
      downloadLink.download = fileName;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);

      // Save to database
      const taxAmount = sgstAmount + cgstAmount;
      const invoiceData = {
        customerId: selectedCustomer,
        invoiceNumber,
        dt: invoiceDate,
        dueDate,
        items: items.map(item => ({
          description: item.description,
          quantity: item.quantity,
          price: item.price,
          total: item.total
        })),
        totalAmount: subtotal,
        taxAmount,
        finalAmount: total,
        paymentStatus: paymentStatus === 'NONE' ? null : paymentStatus,
        googleDriveLink: `https://drive.google.com/file/d/drive_${Math.random().toString(36).substring(2, 15)}/view`
      };

      const response = await apiRequest('POST', 'invoices/upsert', invoiceData);

      if (response.count >= 1) {
        showToast('success', 'Success', 'Invoice generated and saved successfully!');
      } else {
        showToast('warning', 'Warning', 'Invoice generated but failed to save');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      showToast('error', 'Error', 'Failed to generate invoice');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return `₹${parseFloat(value || 0).toFixed(2)}`;
  };

  const formatDateDisplay = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <DashboardLayout title="Invoice Generator">

        <div className="max-w-[100rem] mx-auto p-4">
          <h1 className="text-4xl font-bold text-center text-blue-600 mb-8">Invoice Generator</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              {/* Customer Information */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Customer Information</h2>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Select Customer</label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => handleCustomerChange(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                  >
                    <option value="">-- Select a customer --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Customer Name</label>
                    <input
                      type="text"
                      value={customerDetails.name}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Customer Phone</label>
                    <input
                      type="text"
                      value={customerDetails.phone}
                      disabled
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="mb-6 pb-6 border-b border-gray-200">
                <h2 className="text-xl font-semibold mb-4">Invoice Details</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Invoice Number</label>
                    <input
                      type="text"
                      value={invoiceNumber}
                      onChange={(e) => setInvoiceNumber(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Invoice Date</label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Due Date</label>
                    <input
                      type="date"
                      value={dueDate}
                      readOnly
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 bg-gray-50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">SGST %</label>
                    <input
                      type="number"
                      value={sgstRate}
                      onChange={(e) => setSgstRate(parseFloat(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">CGST %</label>
                    <input
                      type="number"
                      value={cgstRate}
                      onChange={(e) => setCgstRate(parseFloat(e.target.value))}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5"
                    />
                  </div>
                </div>
              </div>

              {/* Invoice Items */}
              <div className="mb-6">
                <h2 className="text-xl font-semibold mb-4">Invoice Items</h2>

                {items.map((item) => (
                  <div key={item.id} className="flex gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Description"
                      value={item.description}
                      onChange={(e) => updateItem(item.id, 'description', e.target.value)}
                      className="flex-[3] border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateItem(item.id, 'quantity', e.target.value)}
                      className="w-20 border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="number"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateItem(item.id, 'price', e.target.value)}
                      className="w-24 border border-gray-300 rounded-lg px-3 py-2"
                    />
                    <input
                      type="text"
                      value={formatCurrency(item.total)}
                      readOnly
                      className="w-28 border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                    />
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="w-10 bg-red-500 text-white rounded-lg hover:bg-red-600"
                    >
                      🗑
                    </button>
                  </div>
                ))}

                <button
                  onClick={addItem}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600"
                >
                  ➕ Add Item
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-between gap-4">
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 font-semibold"
                >
                  🔄 Update Preview
                </button>
                <button
                  onClick={handleGenerateInvoice}
                  disabled={loading}
                  className="bg-green-500 text-white px-6 py-3 rounded-lg hover:bg-green-600 font-semibold disabled:opacity-50"
                >
                  {loading ? 'Generating...' : '📄 Generate Invoice'}
                </button>
              </div>
            </div>

            {/* Preview Section */}
            <div className="bg-white rounded-xl shadow-lg p-6 relative">
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-gray-200 text-9xl font-bold rotate-[-45deg] pointer-events-none opacity-10">
                PREVIEW
              </div>

              <div ref={previewRef} className="relative z-10 p-8 bg-white">
                {/* Header */}
                <div className="flex justify-between mb-8">
                  <div>
                    <h2 className="text-2xl font-bold">{companyDetails.name}</h2>
                    <p className="text-sm whitespace-pre-line">{companyDetails.address}</p>
                    <p className="text-sm">{companyDetails.phone} • {companyDetails.email}</p>
                    <p className="text-sm">GST: {companyDetails.gst}</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-3xl font-bold text-blue-600">INVOICE</h2>
                    <p className="text-sm">{invoiceNumber}</p>
                  </div>
                </div>

                {/* Bill To */}
                <div className="flex justify-between mb-8">
                  <div>
                    <h3 className="font-bold mb-2">Bill To:</h3>
                    <p>{customerDetails.name}</p>
                    <p className="text-sm whitespace-pre-line">{customerDetails.address}</p>
                    <p className="text-sm">{customerDetails.email} • {customerDetails.phone}</p>
                    <p className="text-sm">GST: {customerDetails.gst}</p>
                  </div>
                  <div className="text-right">
                    <table className="text-sm">
                      <tbody>
                        <tr>
                          <td className="font-bold pr-4">Invoice Date:</td>
                          <td>{formatDateDisplay(invoiceDate)}</td>
                        </tr>
                        <tr>
                          <td className="font-bold pr-4">Due Date:</td>
                          <td>{formatDateDisplay(dueDate)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                  <thead className="bg-blue-600 text-white">
                    <tr>
                      <th className="p-2 text-left">Description</th>
                      <th className="p-2 text-center">Quantity</th>
                      <th className="p-2 text-right">Price</th>
                      <th className="p-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b">
                        <td className="p-2">{item.description}</td>
                        <td className="p-2 text-center">{item.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(item.price)}</td>
                        <td className="p-2 text-right">{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <table className="w-1/2">
                    <tbody className="text-sm">
                      <tr>
                        <td className="py-1 pr-4">Subtotal:</td>
                        <td className="text-right">{formatCurrency(subtotal)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-4">SGST ({sgstRate}%):</td>
                        <td className="text-right">{formatCurrency(sgstAmount)}</td>
                      </tr>
                      <tr>
                        <td className="py-1 pr-4">CGST ({cgstRate}%):</td>
                        <td className="text-right">{formatCurrency(cgstAmount)}</td>
                      </tr>
                      <tr className="border-t-2 border-black font-bold">
                        <td className="py-2 pr-4">Total:</td>
                        <td className="text-right">{formatCurrency(total)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Notes */}
                <div className="border-t pt-4 text-sm">
                  <h3 className="font-bold mb-2">Bank Details</h3>
                  <p className="whitespace-pre-line mb-4">{bankDetails}</p>
                  <h3 className="font-bold mb-2">Payment Terms</h3>
                  <p className="mb-4">{paymentTerms}</p>
                  <p>{notes}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
  );

}

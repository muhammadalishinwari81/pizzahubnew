'use client';

import { useState, useEffect } from 'react';

interface Pizza {
  id: string;
  name: string;
  description: string | null;
  basePrice: string;
  imageUrl: string | null;
  isAvailable: boolean;
  branchId: string | null;
  branchName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface Topping {
  id: string;
  name: string;
  price: string;
  category: string;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Branch {
  id: string;
  name: string;
}

export default function AdminMenuPage() {
  const [activeTab, setActiveTab] = useState<'pizzas' | 'toppings'>('pizzas');
  const [pizzas, setPizzas] = useState<Pizza[]>([]);
  const [toppings, setToppings] = useState<Topping[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Pizza | Topping | null>(null);

  const [pizzaFormData, setPizzaFormData] = useState({
    name: '',
    description: '',
    basePrice: '',
    imageUrl: '',
    branchId: '',
    toppingIds: [] as string[],
    isAvailable: true,
  });

  const [toppingFormData, setToppingFormData] = useState({
    name: '',
    price: '',
    category: '',
    isAvailable: true,
  });

  useEffect(() => {
    fetchMenuData();
    fetchBranches();
  }, [activeTab]);

  const fetchMenuData = async () => {
    try {
      const response = await fetch(`/api/admin/menu?type=${activeTab}`);
      const data = await response.json();

      if (response.ok) {
        if (activeTab === 'pizzas') {
          setPizzas(data.pizzas);
        } else {
          setToppings(data.toppings);
        }
      }
    } catch (error) {
      console.error('Error fetching menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await fetch('/api/admin/branches');
      const data = await response.json();
      if (response.ok) {
        setBranches(data.branches);
      }
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const formData = activeTab === 'pizzas' ? pizzaFormData : toppingFormData;
      const response = await fetch('/api/admin/menu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab === 'pizzas' ? 'pizza' : 'topping',
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setShowCreateModal(false);
        if (activeTab === 'pizzas') {
          setPizzaFormData({ name: '', description: '', basePrice: '', imageUrl: '', branchId: '', toppingIds: [], isAvailable: true });
        } else {
          setToppingFormData({ name: '', price: '', category: '', isAvailable: true });
        }
        fetchMenuData();
        alert(`${activeTab === 'pizzas' ? 'Pizza' : 'Topping'} created successfully!`);
      } else {
        alert(data.error || `Error creating ${activeTab === 'pizzas' ? 'pizza' : 'topping'}`);
      }
    } catch (error) {
      console.error('Error creating item:', error);
      alert(`Error creating ${activeTab === 'pizzas' ? 'pizza' : 'topping'}`);
    }
  };

  const handleUpdateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingItem) return;

    try {
      const formData = activeTab === 'pizzas' ? pizzaFormData : toppingFormData;
      const response = await fetch('/api/admin/menu', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeTab === 'pizzas' ? 'pizza' : 'topping',
          id: editingItem.id,
          ...formData,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setEditingItem(null);
        if (activeTab === 'pizzas') {
          setPizzaFormData({ name: '', description: '', basePrice: '', imageUrl: '', branchId: '', toppingIds: [], isAvailable: true });
        } else {
          setToppingFormData({ name: '', price: '', category: '', isAvailable: true });
        }
        fetchMenuData();
        alert(`${activeTab === 'pizzas' ? 'Pizza' : 'Topping'} updated successfully!`);
      } else {
        alert(data.error || `Error updating ${activeTab === 'pizzas' ? 'pizza' : 'topping'}`);
      }
    } catch (error) {
      console.error('Error updating item:', error);
      alert(`Error updating ${activeTab === 'pizzas' ? 'pizza' : 'topping'}`);
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab === 'pizzas' ? 'pizza' : 'topping'}?`)) return;

    try {
      const response = await fetch(`/api/admin/menu?id=${itemId}&type=${activeTab === 'pizzas' ? 'pizza' : 'topping'}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (response.ok) {
        fetchMenuData();
        alert(`${activeTab === 'pizzas' ? 'Pizza' : 'Topping'} deleted successfully!`);
      } else {
        alert(data.error || `Error deleting ${activeTab === 'pizzas' ? 'pizza' : 'topping'}`);
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      alert(`Error deleting ${activeTab === 'pizzas' ? 'pizza' : 'topping'}`);
    }
  };

  const openEditModal = (item: Pizza | Topping) => {
    setEditingItem(item);
    if (activeTab === 'pizzas') {
      const pizza = item as Pizza;
      setPizzaFormData({
        name: pizza.name,
        description: pizza.description || '',
        basePrice: pizza.basePrice,
        imageUrl: pizza.imageUrl || '',
        branchId: pizza.branchId || '',
        toppingIds: [],
        isAvailable: pizza.isAvailable,
      });
    } else {
      const topping = item as Topping;
      setToppingFormData({
        name: topping.name,
        price: topping.price,
        category: topping.category,
        isAvailable: topping.isAvailable,
      });
    }
  };

  const closeModals = () => {
    setShowCreateModal(false);
    setEditingItem(null);
    if (activeTab === 'pizzas') {
      setPizzaFormData({ name: '', description: '', basePrice: '', imageUrl: '', branchId: '', toppingIds: [], isAvailable: true });
    } else {
      setToppingFormData({ name: '', price: '', category: '', isAvailable: true });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading menu...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Menu Management</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add New {activeTab === 'pizzas' ? 'Pizza' : 'Topping'}
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('pizzas')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'pizzas'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Pizzas ({pizzas.length})
          </button>
          <button
            onClick={() => setActiveTab('toppings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'toppings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Toppings ({toppings.length})
          </button>
        </nav>
      </div>

      {/* Content */}
      {activeTab === 'pizzas' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Description
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Branch
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {pizzas.map((pizza) => (
                <tr key={pizza.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {pizza.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {pizza.description || 'No description'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${pizza.basePrice}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {pizza.branchName || 'No branch assigned'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      pizza.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {pizza.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditModal(pizza)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(pizza.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {toppings.map((topping) => (
                <tr key={topping.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {topping.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    ${topping.price}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {topping.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      topping.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {topping.isAvailable ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => openEditModal(topping)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDeleteItem(topping.id)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      {(showCreateModal || editingItem) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingItem ? `Edit ${activeTab === 'pizzas' ? 'Pizza' : 'Topping'}` : `Create New ${activeTab === 'pizzas' ? 'Pizza' : 'Topping'}`}
              </h3>
              <form onSubmit={editingItem ? handleUpdateItem : handleCreateItem}>
                {activeTab === 'pizzas' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Pizza Name
                      </label>
                      <input
                        type="text"
                        value={pizzaFormData.name}
                        onChange={(e) => setPizzaFormData({ ...pizzaFormData, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        value={pizzaFormData.description}
                        onChange={(e) => setPizzaFormData({ ...pizzaFormData, description: e.target.value })}
                        rows={3}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={pizzaFormData.basePrice}
                        onChange={(e) => setPizzaFormData({ ...pizzaFormData, basePrice: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Image URL
                      </label>
                      <input
                        type="url"
                        value={pizzaFormData.imageUrl}
                        onChange={(e) => setPizzaFormData({ ...pizzaFormData, imageUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Branch
                      </label>
                      <select
                        value={pizzaFormData.branchId}
                        onChange={(e) => setPizzaFormData({ ...pizzaFormData, branchId: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a branch</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={pizzaFormData.isAvailable}
                          onChange={(e) => setPizzaFormData({ ...pizzaFormData, isAvailable: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Available</span>
                      </label>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Topping Name
                      </label>
                      <input
                        type="text"
                        value={toppingFormData.name}
                        onChange={(e) => setToppingFormData({ ...toppingFormData, name: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        value={toppingFormData.price}
                        onChange={(e) => setToppingFormData({ ...toppingFormData, price: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Category
                      </label>
                      <select
                        value={toppingFormData.category}
                        onChange={(e) => setToppingFormData({ ...toppingFormData, category: e.target.value })}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select a category</option>
                        <option value="meat">Meat</option>
                        <option value="vegetable">Vegetable</option>
                        <option value="cheese">Cheese</option>
                        <option value="sauce">Sauce</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={toppingFormData.isAvailable}
                          onChange={(e) => setToppingFormData({ ...toppingFormData, isAvailable: e.target.checked })}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">Available</span>
                      </label>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={closeModals}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
                  >
                    {editingItem ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

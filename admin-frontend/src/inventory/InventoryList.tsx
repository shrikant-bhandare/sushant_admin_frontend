import React, { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const InventoryList = () => {
  const [inventory, setInventory] = useState([]);
  const [filteredInventory, setFilteredInventory] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_APIURL}/api/inventory`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('accessToken')}` }
        });
        const data = await response.json();
        if (data.success) {
          setInventory(data.data);
          setFilteredInventory(data.data);
        }
      } catch (error) {
        console.error("Error fetching inventory:", error);
      }
    };

    fetchInventory();
  }, []);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    const filtered = inventory.filter((item) =>
      item.name.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredInventory(filtered);
  };

  const handleFilterChange = (value: string) => {
    setFilter(value);
    const filtered = inventory.filter((item) => item.category === value);
    setFilteredInventory(filtered);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Inventory</h1>
      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search inventory..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
          className="w-1/3"
        />
        <Select onValueChange={handleFilterChange}>
          <SelectTrigger className="w-1/3">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All</SelectItem>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="furniture">Furniture</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setFilteredInventory(inventory)}>Reset</Button>
      </div>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Category</TableCell>
            <TableCell>Stock</TableCell>
            <TableCell>Price</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredInventory.map((item) => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              <TableCell>{item.category}</TableCell>
              <TableCell>{item.stock}</TableCell>
              <TableCell>${item.price}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default InventoryList;

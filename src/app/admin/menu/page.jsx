"use client";

import { useState, useEffect } from "react";
import { MotionDiv, MotionButton } from "../../components/MotionComponents";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../../../../firebase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "../navbar";
import Sidebar from "../sidebar";
import { isAuthenticated } from "@/app/utils/auth";
import { useRouter } from "next/navigation";

export default function MenuPage() {
  const INITIAL_MENU_STATE = {
    name: "",
    description: "",
    price: "",
    image: "",
  };

  const [menuItems, setMenuItems] = useState([]);
  const [newMenuItem, setNewMenuItem] = useState(INITIAL_MENU_STATE);
  const [showAddMenuItem, setShowAddMenuItem] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const checkAuth = async () => {
      console.log("Checking authentication...");
      const roleMap = {
        admin: true,
      };
      for (const role of Object.keys(roleMap)) {
        const authorized = await isAuthenticated(role);
        if (authorized) {
          console.log("User is authorized:", role);
          setIsAuthorized(true);
          return;
        }
      }
      router.push("/auth/login");
    };

    if (auth.currentUser) {
      checkAuth();
    }
  }, [auth.currentUser]);

  useEffect(() => {
    const fetchMenuItems = async () => {
      const menuSnapshot = await getDocs(collection(db, "menu"));
      setMenuItems(
        menuSnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      );
    };
    fetchMenuItems();
  }, []);

  const validateMenuData = (menuItem) => {
    if (!menuItem.name.trim()) return "Menu item name is required";
    if (!menuItem.description.trim()) return "Description is required";
    if (!menuItem.price || isNaN(menuItem.price))
      return "Valid price is required";
    if (!menuItem.image.trim()) return "Image URL is required";
    return null;
  };

  const handleAddMenuItem = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationError = validateMenuData(newMenuItem);
    if (validationError) {
      setIsSubmitting(false);
      return;
    }

    try {
      if (isEditing) {
        await updateDoc(doc(db, "menu", editingId), {
          name: newMenuItem.name,
          description: newMenuItem.description,
          price: parseFloat(newMenuItem.price),
          image: newMenuItem.image,
          updatedAt: new Date().toISOString(),
        });

        setMenuItems((prev) =>
          prev.map((item) =>
            item.id === editingId ? { ...newMenuItem, id: editingId } : item
          )
        );
      } else {
        const menuRef = await addDoc(collection(db, "menu"), {
          name: newMenuItem.name,
          description: newMenuItem.description,
          price: parseFloat(newMenuItem.price),
          image: newMenuItem.image,
          createdAt: new Date().toISOString(),
        });

        setMenuItems((prev) => [...prev, { id: menuRef.id, ...newMenuItem }]);
      }

      handleMenuDialogClose();
    } catch (error) {
      console.error("Error adding/updating menu item:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditMenuItem = async (item) => {
    setNewMenuItem(item);
    setIsEditing(true);
    setEditingId(item.id);
    setShowAddMenuItem(true);
  };

  const handleDeleteMenuItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this menu item?")) {
      try {
        await deleteDoc(doc(db, "menu", id));
        setMenuItems(menuItems.filter((item) => item.id !== id));
      } catch (error) {
        console.error("Error deleting menu item:", error);
      }
    }
  };

  const handleMenuDialogClose = () => {
    setNewMenuItem(INITIAL_MENU_STATE);
    setShowAddMenuItem(false);
    setIsEditing(false);
    setEditingId(null);
  };

  const AddMenuDialog = () => (
    <Dialog
      open={showAddMenuItem}
      onOpenChange={(open) => {
        if (!open) handleMenuDialogClose();
        else setShowAddMenuItem(true);
      }}
    >
      <DialogTrigger asChild>
        <MotionButton
          whileHover={{ scale: 1.05 }}
          className="bg-[#fdb040] text-white px-6 py-2 rounded-lg"
        >
          Add Menu Item
        </MotionButton>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Menu Item" : "Add New Menu Item"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleAddMenuItem} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Name</label>
            <Input
              required
              value={newMenuItem.name}
              onChange={(e) =>
                setNewMenuItem((prev) => ({ ...prev, name: e.target.value }))
              }
              placeholder="Menu item name"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Description</label>
            <Textarea
              required
              value={newMenuItem.description}
              onChange={(e) =>
                setNewMenuItem((prev) => ({
                  ...prev,
                  description: e.target.value,
                }))
              }
              placeholder="Menu item description"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Price (₱)</label>
            <Input
              required
              type="number"
              step="0.01"
              min="0"
              value={newMenuItem.price}
              onChange={(e) =>
                setNewMenuItem((prev) => ({ ...prev, price: e.target.value }))
              }
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Image URL</label>
            <Input
              required
              value={newMenuItem.image}
              onChange={(e) =>
                setNewMenuItem((prev) => ({ ...prev, image: e.target.value }))
              }
              placeholder="Image URL"
            />
          </div>
          <Button
            type="submit"
            className="w-full bg-[#fdb040]"
            disabled={isSubmitting}
          >
            {isSubmitting
              ? isEditing
                ? "Updating..."
                : "Adding..."
              : isEditing
              ? "Update Menu Item"
              : "Add Menu Item"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-16">
        <div className="flex h-[calc(100vh-64px)]">
          <div className="flex">
            <div className="hidden md:flex w-72 flex-col fixed inset-y-16 z-50">
              <Sidebar />
            </div>
            <main className="md:pl-72 w-full">
              <div className="max-w-[1920px] mx-auto p-6">
                <div className="flex justify-between items-center mb-6">
                  <h1 className="text-2xl font-bold">Menu Management</h1>
                  {AddMenuDialog()}
                </div>
                <div className="grid gap-4">
                  {menuItems.map((item) => (
                    <MotionDiv
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 bg-white rounded-xl shadow-sm border-2 border-[#fdb040]/20"
                    >
                      <div className="flex justify-between items-start">
                        <div className="space-y-2 flex-1">
                          <div className="flex items-center gap-4">
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-16 h-16 object-cover rounded"
                            />
                            <div>
                              <h3 className="text-xl font-semibold">
                                {item.name}
                              </h3>
                              <p className="text-gray-600">
                                {item.description}
                              </p>
                              <p className="font-medium text-[#fdb040]">
                                ₱{item.price}
                              </p>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => handleEditMenuItem(item)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            onClick={() => handleDeleteMenuItem(item.id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </div>
                    </MotionDiv>
                  ))}
                </div>
              </div>
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}

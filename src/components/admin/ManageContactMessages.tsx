import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Mail, MailOpen, CheckCircle, Clock } from "lucide-react";

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  created_at: string;
  read: boolean;
  replied: boolean;
}

export default function ManageContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [activeTab, setActiveTab] = useState("unread");
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from("contact_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error("Error fetching contact messages:", error);
      toast({
        title: "Error",
        description: "Failed to load contact messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ read: true })
        .eq("id", id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, read: true } : msg))
      );
    } catch (error) {
      console.error("Error marking as read:", error);
      toast({
        title: "Error",
        description: "Failed to mark message as read",
        variant: "destructive",
      });
    }
  };

  const markAsReplied = async (id: string) => {
    try {
      const { error } = await supabase
        .from("contact_messages")
        .update({ replied: true })
        .eq("id", id);

      if (error) throw error;

      setMessages((prev) =>
        prev.map((msg) => (msg.id === id ? { ...msg, replied: true } : msg))
      );

      toast({
        title: "Success",
        description: "Message marked as replied",
      });
    } catch (error) {
      console.error("Error marking as replied:", error);
      toast({
        title: "Error",
        description: "Failed to mark message as replied",
        variant: "destructive",
      });
    }
  };

  const openMessage = (message: ContactMessage) => {
    setSelectedMessage(message);
    if (!message.read) {
      markAsRead(message.id);
    }
  };

  const unreadMessages = messages.filter((msg) => !msg.read);
  const readMessages = messages.filter((msg) => msg.read && !msg.replied);
  const repliedMessages = messages.filter((msg) => msg.replied);

  const MessageTable = ({ messages }: { messages: ContactMessage[] }) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Status</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Subject</TableHead>
          <TableHead>Date</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {messages.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="text-center text-muted-foreground">
              No messages found
            </TableCell>
          </TableRow>
        ) : (
          messages.map((msg) => (
            <TableRow key={msg.id} className="cursor-pointer hover:bg-muted/50">
              <TableCell onClick={() => openMessage(msg)}>
                {msg.replied ? (
                  <Badge variant="default" className="gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Replied
                  </Badge>
                ) : msg.read ? (
                  <Badge variant="secondary" className="gap-1">
                    <MailOpen className="w-3 h-3" />
                    Read
                  </Badge>
                ) : (
                  <Badge variant="outline" className="gap-1">
                    <Mail className="w-3 h-3" />
                    Unread
                  </Badge>
                )}
              </TableCell>
              <TableCell onClick={() => openMessage(msg)} className="font-medium">
                {msg.name}
              </TableCell>
              <TableCell onClick={() => openMessage(msg)}>{msg.email}</TableCell>
              <TableCell onClick={() => openMessage(msg)}>{msg.subject}</TableCell>
              <TableCell onClick={() => openMessage(msg)}>
                {new Date(msg.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => openMessage(msg)}
                >
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

  if (loading) {
    return (
      <Card className="p-8">
        <div className="flex items-center justify-center">
          <Clock className="w-6 h-6 animate-spin" />
          <span className="ml-2">Loading messages...</span>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Contact Messages</h2>
          <div className="flex gap-4">
            <Badge variant="outline" className="gap-2">
              <Mail className="w-4 h-4" />
              {unreadMessages.length} Unread
            </Badge>
            <Badge variant="secondary" className="gap-2">
              <MailOpen className="w-4 h-4" />
              {readMessages.length} Read
            </Badge>
            <Badge variant="default" className="gap-2">
              <CheckCircle className="w-4 h-4" />
              {repliedMessages.length} Replied
            </Badge>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="unread">
              Unread ({unreadMessages.length})
            </TabsTrigger>
            <TabsTrigger value="read">Read ({readMessages.length})</TabsTrigger>
            <TabsTrigger value="replied">
              Replied ({repliedMessages.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="unread" className="mt-6">
            <MessageTable messages={unreadMessages} />
          </TabsContent>

          <TabsContent value="read" className="mt-6">
            <MessageTable messages={readMessages} />
          </TabsContent>

          <TabsContent value="replied" className="mt-6">
            <MessageTable messages={repliedMessages} />
          </TabsContent>
        </Tabs>
      </Card>

      <Dialog
        open={!!selectedMessage}
        onOpenChange={() => setSelectedMessage(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Contact Message</DialogTitle>
            <DialogDescription>
              From {selectedMessage?.name} ({selectedMessage?.email})
            </DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold mb-1">Subject</h4>
                <p className="text-sm">{selectedMessage.subject}</p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Message</h4>
                <p className="text-sm whitespace-pre-wrap">
                  {selectedMessage.message}
                </p>
              </div>

              <div>
                <h4 className="font-semibold mb-1">Received</h4>
                <p className="text-sm">
                  {new Date(selectedMessage.created_at).toLocaleString()}
                </p>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => {
                    window.location.href = `mailto:${selectedMessage.email}?subject=Re: ${selectedMessage.subject}`;
                  }}
                  className="flex-1"
                >
                  Reply via Email
                </Button>
                {!selectedMessage.replied && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      markAsReplied(selectedMessage.id);
                      setSelectedMessage(null);
                    }}
                    className="flex-1"
                  >
                    Mark as Replied
                  </Button>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface User {
  id: number;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string | null;
  is_online: boolean;
}

interface Message {
  id: number;
  sender_id: number;
  content: string;
  image_url: string | null;
  created_at: string;
}

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedChat, setSelectedChat] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');

  useEffect(() => {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
      loadUsers();
    }
  }, []);

  useEffect(() => {
    if (selectedChat && currentUser) {
      loadMessages();
    }
  }, [selectedChat]);

  const loadUsers = () => {
    const mockUsers: User[] = [
      {
        id: 1,
        username: 'ti_test',
        display_name: 'Ti Test',
        avatar_url: null,
        bio: 'Тестовый бот',
        is_online: true,
      },
    ];
    setUsers(mockUsers);
  };

  const loadMessages = () => {
    if (!selectedChat) return;
    
    const chatKey = `messages_${currentUser?.id}_${selectedChat.id}`;
    const savedMessages = localStorage.getItem(chatKey);
    if (savedMessages) {
      setMessages(JSON.parse(savedMessages));
    } else {
      setMessages([]);
    }
  };

  const saveMessages = (msgs: Message[]) => {
    if (!selectedChat || !currentUser) return;
    const chatKey = `messages_${currentUser.id}_${selectedChat.id}`;
    localStorage.setItem(chatKey, JSON.stringify(msgs));
  };

  const handleRegister = () => {
    if (!username || !displayName) return;

    const newUser: User = {
      id: Date.now(),
      username,
      display_name: displayName,
      avatar_url: null,
      bio: bio || null,
      is_online: true,
    };

    setCurrentUser(newUser);
    localStorage.setItem('currentUser', JSON.stringify(newUser));
    loadUsers();
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedUser = { ...currentUser, avatar_url: reader.result as string };
        setCurrentUser(updatedUser);
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedChat || !currentUser) return;

    const message: Message = {
      id: Date.now(),
      sender_id: currentUser.id,
      content: newMessage,
      image_url: null,
      created_at: new Date().toISOString(),
    };

    const updatedMessages = [...messages, message];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setNewMessage('');

    if (selectedChat.username === 'ti_test') {
      setTimeout(() => {
        const botReply: Message = {
          id: Date.now() + 1,
          sender_id: selectedChat.id,
          content: 'Извините, я не могу отвечать на сообщения.',
          image_url: null,
          created_at: new Date().toISOString(),
        };
        const withBotReply = [...updatedMessages, botReply];
        setMessages(withBotReply);
        saveMessages(withBotReply);
      }, 500);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && selectedChat && currentUser) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const message: Message = {
          id: Date.now(),
          sender_id: currentUser.id,
          content: '',
          image_url: reader.result as string,
          created_at: new Date().toISOString(),
        };
        const updatedMessages = [...messages, message];
        setMessages(updatedMessages);
        saveMessages(updatedMessages);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.display_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#1E3A8A] via-[#0EA5E9] to-[#06B6D4]">
        <Card className="w-full max-w-md p-8 bg-card/95 backdrop-blur border-primary/20">
          <div className="flex flex-col items-center mb-8">
            <img 
              src="https://cdn.poehali.dev/files/754d186f-dd97-4432-bf56-897f0937bf7b.png" 
              alt="Ti Messenger" 
              className="w-24 h-24 mb-4 rounded-2xl"
            />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Ti Messenger
            </h1>
            <p className="text-muted-foreground mt-2">Современная соцсеть для общения</p>
          </div>

          <div className="space-y-4">
            <Input
              placeholder="Имя пользователя"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="bg-muted/50 border-primary/20"
            />
            <Input
              placeholder="Отображаемое имя"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="bg-muted/50 border-primary/20"
            />
            <Textarea
              placeholder="О себе (необязательно)"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="bg-muted/50 border-primary/20 resize-none"
              rows={3}
            />
            <Button 
              onClick={handleRegister} 
              className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white font-medium"
            >
              Создать профиль
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-[#1E3A8A] via-[#0EA5E9] to-[#06B6D4]">
      <header className="bg-card/95 backdrop-blur border-b border-primary/20 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="https://cdn.poehali.dev/files/754d186f-dd97-4432-bf56-897f0937bf7b.png" 
              alt="Ti Messenger" 
              className="w-10 h-10 rounded-xl"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Ti Messenger
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Avatar className="cursor-pointer border-2 border-primary/50">
              <AvatarImage src={currentUser.avatar_url || undefined} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                {currentUser.display_name[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{currentUser.display_name}</p>
              <p className="text-xs text-muted-foreground">@{currentUser.username}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 flex max-w-7xl w-full mx-auto overflow-hidden gap-4 p-4">
        <Card className="w-80 bg-card/95 backdrop-blur border-primary/20 flex flex-col">
          <div className="p-4 border-b border-primary/20">
            <Input
              placeholder="Поиск пользователей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-muted/50 border-primary/20"
            />
          </div>

          <Tabs defaultValue="online" className="flex-1 flex flex-col">
            <TabsList className="mx-4 mt-4 grid grid-cols-2 bg-muted/50">
              <TabsTrigger value="online">Онлайн</TabsTrigger>
              <TabsTrigger value="all">Все</TabsTrigger>
            </TabsList>

            <TabsContent value="online" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {filteredUsers
                    .filter((user) => user.is_online)
                    .map((user) => (
                      <div
                        key={user.id}
                        onClick={() => setSelectedChat(user)}
                        className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                          selectedChat?.id === user.id
                            ? 'bg-primary/20 border border-primary/50'
                            : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="relative">
                          <Avatar className="border-2 border-primary/50">
                            <AvatarImage src={user.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                              {user.display_name[0]}
                            </AvatarFallback>
                          </Avatar>
                          {user.is_online && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{user.display_name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                    ))}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="all" className="flex-1 mt-0">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-2">
                  {filteredUsers.map((user) => (
                    <div
                      key={user.id}
                      onClick={() => setSelectedChat(user)}
                      className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                        selectedChat?.id === user.id
                          ? 'bg-primary/20 border border-primary/50'
                          : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="border-2 border-primary/50">
                          <AvatarImage src={user.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                            {user.display_name[0]}
                          </AvatarFallback>
                        </Avatar>
                        {user.is_online && (
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-card"></div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.display_name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          <div className="p-4 border-t border-primary/20">
            <label className="cursor-pointer">
              <div className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition-opacity text-white font-medium">
                <Icon name="Upload" size={20} />
                <span>Загрузить аватар</span>
              </div>
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>
        </Card>

        <Card className="flex-1 bg-card/95 backdrop-blur border-primary/20 flex flex-col">
          {selectedChat ? (
            <>
              <div className="p-4 border-b border-primary/20 flex items-center gap-3">
                <Avatar className="border-2 border-primary/50">
                  <AvatarImage src={selectedChat.avatar_url || undefined} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white">
                    {selectedChat.display_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{selectedChat.display_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {selectedChat.is_online ? 'В сети' : 'Не в сети'}
                  </p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOwn = msg.sender_id === currentUser.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            isOwn
                              ? 'bg-gradient-to-r from-primary to-secondary text-white'
                              : 'bg-muted'
                          }`}
                        >
                          {msg.image_url && (
                            <img
                              src={msg.image_url}
                              alt="Изображение"
                              className="rounded-lg mb-2 max-w-full"
                            />
                          )}
                          {msg.content && <p>{msg.content}</p>}
                          <p
                            className={`text-xs mt-1 ${
                              isOwn ? 'text-white/70' : 'text-muted-foreground'
                            }`}
                          >
                            {new Date(msg.created_at).toLocaleTimeString('ru-RU', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>

              <div className="p-4 border-t border-primary/20 flex gap-2">
                <label className="cursor-pointer">
                  <Button variant="outline" size="icon" className="border-primary/20" asChild>
                    <span>
                      <Icon name="Image" size={20} />
                    </span>
                  </Button>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
                <Input
                  placeholder="Введите сообщение..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 bg-muted/50 border-primary/20"
                />
                <Button
                  onClick={handleSendMessage}
                  className="bg-gradient-to-r from-primary to-secondary hover:opacity-90 text-white"
                >
                  <Icon name="Send" size={20} />
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Icon name="MessageCircle" size={64} className="mx-auto mb-4 text-muted-foreground" />
                <p className="text-xl font-medium text-muted-foreground">
                  Выберите чат для начала общения
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Index;
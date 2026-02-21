"use client";

import { useRef, useState } from "react";
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useTransform,
  type PanInfo,
} from "framer-motion";
import {
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  Palette,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import type { Todo, TodoList as TodoListType } from "@/lib/calendar-data";

interface TodoListProps {
  todoLists: TodoListType[];
  todos: Todo[];
  onToggle: (id: string) => void;
  onRemoveTodo: (id: string) => void;
  onAdd: (text: string, listId: string) => void;
  onAddList: (name: string, color: string) => void;
  onDeleteList: (listId: string) => void;
  onRenameList: (listId: string, name: string) => void;
  onRecolorList: (listId: string, color: string) => void;
}

const spring = { type: "spring" as const, stiffness: 300, damping: 30 };
const gentleSpring = { type: "spring" as const, stiffness: 200, damping: 24 };

const LIST_COLORS = [
  "#6f8c5c",
  "#d08d57",
  "#7f9f95",
  "#b77469",
  "#8b86b8",
  "#7a97c7",
  "#b89a54",
  "#6f9d87",
];

const SWIPE_THRESHOLD = 50;

function TodoItem({
  todo,
  color,
  onComplete,
}: {
  todo: Todo;
  color: string;
  onComplete: (id: string) => void;
}) {
  const [checking, setChecking] = useState(false);

  function handleCheck() {
    setChecking(true);
    // Brief delay so the user sees the check animation before it disappears
    setTimeout(() => onComplete(todo.id), 450);
  }

  const dueLabel = (() => {
    if (todo.scheduleToken) {
      return `@${todo.scheduleToken}`;
    }
    if (!todo.dueAt) {
      return null;
    }
    const date = new Date(todo.dueAt);
    if (Number.isNaN(date.getTime())) {
      return null;
    }
    return format(date, "EEE, MMM d");
  })();

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{
        opacity: 0,
        x: 30,
        scale: 0.9,
        transition: { duration: 0.25 },
      }}
      transition={gentleSpring}
      className="group flex items-start gap-3 rounded-xl px-2 py-2 transition-colors hover:bg-[var(--muted)]/70"
    >
      <button
        onClick={handleCheck}
        className="mt-0.5 flex-shrink-0 relative"
        aria-label={`Complete "${todo.text}"`}
      >
        <motion.div
          className="w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: color }}
          initial={{ backgroundColor: "rgba(0,0,0,0)" }}
          animate={
            checking
              ? { backgroundColor: color, borderColor: color, scale: [1, 1.2, 1] }
              : { backgroundColor: "rgba(0,0,0,0)", borderColor: color }
          }
          transition={spring}
        >
          <AnimatePresence>
            {checking && (
              <motion.svg
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={spring}
                className="w-2.5 h-2.5"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M2.5 6L5 8.5L9.5 3.5"
                  stroke="#243022"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            )}
          </AnimatePresence>
        </motion.div>
      </button>

      <div className="min-w-0">
        <motion.span
          className="text-[13px] leading-relaxed"
          animate={
            checking
              ? { opacity: 0.3, textDecoration: "line-through" }
              : { opacity: 1, textDecoration: "none" }
          }
          transition={{ duration: 0.2 }}
          style={{ color: "var(--foreground)" }}
        >
          {todo.text}
        </motion.span>
        {dueLabel && (
          <div className="mt-0.5 text-[10px] uppercase tracking-wide text-[var(--muted-foreground)]">
            {dueLabel}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ListMenu({
  list,
  onDelete,
  onRename,
  onRecolor,
}: {
  list: TodoListType;
  onDelete: () => void;
  onRename: (name: string) => void;
  onRecolor: (color: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(list.name);

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (renameValue.trim()) {
      onRename(renameValue.trim());
      setIsRenaming(false);
    }
  }

  if (isRenaming) {
    return (
      <form onSubmit={handleRenameSubmit} className="flex-1">
        <input
          type="text"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={() => {
            if (renameValue.trim()) onRename(renameValue.trim());
            setIsRenaming(false);
          }}
          autoFocus
          className="w-full bg-transparent text-sm font-bold text-[var(--foreground)] outline-none border-b border-[var(--primary)] pb-0.5"
        />
      </form>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={() => {
          setShowMenu(!showMenu);
          setShowColorPicker(false);
        }}
        className="p-1 rounded-lg hover:bg-[var(--secondary)] transition-colors"
        aria-label={`Options for ${list.name}`}
      >
        <MoreHorizontal className="w-4 h-4 text-[var(--muted-foreground)]" />
      </button>

      <AnimatePresence>
        {showMenu && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-1 w-40 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-lg"
          >
            <button
              onClick={() => {
                setIsRenaming(true);
                setRenameValue(list.name);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
            >
              <Pencil className="w-3 h-3" />
              Rename
            </button>
            <button
              onClick={() => {
                setShowColorPicker(true);
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-[var(--foreground)] hover:bg-[var(--secondary)] transition-colors"
            >
              <Palette className="w-3 h-3" />
              Change color
            </button>
            <button
              onClick={() => {
                onDelete();
                setShowMenu(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-[12px] text-[var(--destructive)] hover:bg-[var(--destructive)]/10 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              Delete list
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showColorPicker && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className="absolute right-0 top-full z-50 mt-1 rounded-xl border border-[var(--border)] bg-[var(--card)] p-2.5 shadow-lg"
          >
            <div className="grid grid-cols-4 gap-2">
              {LIST_COLORS.map((c) => (
                <button
                  key={c}
                  onClick={() => {
                    onRecolor(c);
                    setShowColorPicker(false);
                  }}
                  className={`w-6 h-6 rounded-full transition-transform hover:scale-110 ${
                    c === list.color
                      ? "ring-2 ring-offset-2 ring-offset-[var(--card)]"
                      : ""
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Set color to ${c}`}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SingleListView({
  list,
  todos,
  onComplete,
  onAdd,
  onDelete,
  onRename,
  onRecolor,
  direction,
}: {
  list: TodoListType;
  todos: Todo[];
  onComplete: (id: string) => void;
  onAdd: (text: string, listId: string) => void;
  onDelete: () => void;
  onRename: (name: string) => void;
  onRecolor: (color: string) => void;
  direction: number;
}) {
  const [inputValue, setInputValue] = useState("");
  const activeTodos = todos.filter((t) => !t.completed);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (inputValue.trim()) {
      onAdd(inputValue.trim(), list.id);
      setInputValue("");
    }
  }

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 200 : -200,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -200 : 200,
      opacity: 0,
    }),
  };

  return (
    <motion.div
      key={list.id}
      custom={direction}
      variants={slideVariants}
      initial="enter"
      animate="center"
      exit="exit"
      transition={gentleSpring}
      className="absolute inset-0 flex flex-col"
    >
      {/* List title + menu */}
      <div className="flex items-center gap-2 px-1 mb-3">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: list.color }}
        />
        <h3 className="flex-1 truncate text-sm font-bold text-[var(--foreground)]">
          {list.name}
        </h3>
        <span
          className="text-[11px] font-medium px-1.5 py-0.5 rounded-md"
          style={{
            backgroundColor: `${list.color}20`,
            color: list.color,
          }}
        >
          {activeTodos.length} task{activeTodos.length !== 1 ? "s" : ""}
        </span>
        <ListMenu
          list={list}
          onDelete={onDelete}
          onRename={onRename}
          onRecolor={onRecolor}
        />
      </div>

      {/* Add task */}
      <form onSubmit={handleSubmit} className="mb-2 px-1">
        <div className="flex items-center gap-2 rounded-xl border border-transparent bg-[var(--muted)]/80 px-3 py-2 transition-colors focus-within:border-[var(--border)]">
          <Plus className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Add a task..."
            className="flex-1 bg-transparent text-[13px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 outline-none"
          />
        </div>
      </form>

      {/* Todo items */}
      <div className="flex-1 overflow-y-auto calendar-scroll px-1">
        <AnimatePresence mode="popLayout">
          {activeTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              color={list.color}
              onComplete={onComplete}
            />
          ))}
        </AnimatePresence>

        {activeTodos.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-8 text-center"
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center mb-2"
              style={{ backgroundColor: `${list.color}15` }}
            >
              <motion.svg
                className="w-4 h-4"
                viewBox="0 0 16 16"
                fill="none"
                style={{ color: list.color }}
              >
                <path
                  d="M4 8L7 11L12 5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </motion.svg>
            </div>
            <p className="text-[12px] text-[var(--muted-foreground)]">
              All done!
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

export function TodoListPanel({
  todoLists,
  todos,
  onToggle,
  onRemoveTodo,
  onAdd,
  onAddList,
  onDeleteList,
  onRenameList,
  onRecolorList,
}: TodoListProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [newListName, setNewListName] = useState("");
  const [selectedColor, setSelectedColor] = useState(LIST_COLORS[0]);
  const dragX = useMotionValue(0);
  const constraintRef = useRef<HTMLDivElement>(null);

  const currentIndex = Math.min(activeIndex, Math.max(0, todoLists.length - 1));
  const currentList = todoLists[currentIndex];
  const listTodos = currentList
    ? todos.filter((t) => t.listId === currentList.id)
    : [];

  function goTo(index: number) {
    const clamped = Math.max(0, Math.min(index, todoLists.length - 1));
    setDirection(clamped > currentIndex ? 1 : -1);
    setActiveIndex(clamped);
  }

  function handleDragEnd(_: unknown, info: PanInfo) {
    if (info.offset.x < -SWIPE_THRESHOLD && currentIndex < todoLists.length - 1) {
      goTo(currentIndex + 1);
    } else if (info.offset.x > SWIPE_THRESHOLD && currentIndex > 0) {
      goTo(currentIndex - 1);
    }
  }

  function handleCompleteTodo(id: string) {
    // Mark as completed first (triggers check animation), then remove
    onToggle(id);
    setTimeout(() => onRemoveTodo(id), 500);
  }

  function handleCreateSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (newListName.trim()) {
      onAddList(newListName.trim(), selectedColor);
      setNewListName("");
      setSelectedColor(LIST_COLORS[0]);
      setIsCreating(false);
      // Navigate to the new list
      setTimeout(() => goTo(todoLists.length), 50);
    }
  }

  function handleDeleteCurrentList() {
    if (!currentList) return;
    onDeleteList(currentList.id);
    if (currentIndex > 0) {
      setActiveIndex(currentIndex - 1);
    }
  }

  const dragOpacity = useTransform(dragX, [-100, 0, 100], [0.5, 1, 0.5]);

  return (
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-2">
      {/* Header row */}
      <div className="flex items-center justify-between px-1 mb-2">
        <h2 className="text-[10px] font-semibold uppercase tracking-widest text-[var(--muted-foreground)]">
          Tasks
        </h2>
        <div className="flex items-center gap-1">
          <motion.button
            onClick={() => goTo(currentIndex - 1)}
            disabled={currentIndex <= 0}
            className="p-1 rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.9 }}
            aria-label="Previous list"
          >
            <ChevronLeft className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          </motion.button>
          <motion.button
            onClick={() => goTo(currentIndex + 1)}
            disabled={currentIndex >= todoLists.length - 1}
            className="p-1 rounded-lg hover:bg-[var(--secondary)] transition-colors disabled:opacity-20 disabled:cursor-not-allowed"
            whileTap={{ scale: 0.9 }}
            aria-label="Next list"
          >
            <ChevronRight className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          </motion.button>
          <motion.button
            onClick={() => setIsCreating(!isCreating)}
            className="p-1 rounded-lg hover:bg-[var(--secondary)] transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            transition={spring}
            aria-label="Create new list"
          >
            <Plus className="w-3.5 h-3.5 text-[var(--muted-foreground)]" />
          </motion.button>
        </div>
      </div>

      {/* Dot indicators */}
      {todoLists.length > 1 && (
        <div className="flex items-center justify-center gap-1.5 mb-2">
          {todoLists.map((list, i) => (
            <button
              key={list.id}
              onClick={() => goTo(i)}
              className="transition-all"
              aria-label={`Go to ${list.name}`}
            >
              <motion.div
                className="rounded-full"
                animate={{
                  width: i === currentIndex ? 16 : 6,
                  height: 6,
                  backgroundColor:
                    i === currentIndex ? list.color : "var(--muted-foreground)",
                  opacity: i === currentIndex ? 1 : 0.3,
                }}
                transition={spring}
              />
            </button>
          ))}
        </div>
      )}

      {/* New list form */}
      <AnimatePresence>
        {isCreating && (
          <motion.form
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            onSubmit={handleCreateSubmit}
            className="mb-2 overflow-hidden"
          >
            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/75 p-3">
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="List name..."
                autoFocus
                className="w-full bg-transparent text-[13px] text-[var(--foreground)] placeholder:text-[var(--muted-foreground)]/50 outline-none mb-2.5"
              />
              <div className="flex items-center gap-2 mb-2.5">
                {LIST_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-5 h-5 rounded-full transition-transform hover:scale-110 ${
                      c === selectedColor
                        ? "ring-2 ring-offset-2 ring-offset-[var(--card)]"
                        : ""
                    }`}
                    style={{ backgroundColor: c }}
                    aria-label={`Select color ${c}`}
                  />
                ))}
              </div>
              <div className="flex gap-1.5">
                <button
                  type="submit"
                  className="rounded-lg bg-[var(--primary)] px-3 py-1.5 text-[11px] font-semibold text-[var(--primary-foreground)] transition-opacity hover:opacity-90"
                >
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="rounded-lg px-3 py-1.5 text-[11px] font-medium text-[var(--muted-foreground)] transition-colors hover:bg-[var(--secondary)]"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Swipeable list area */}
      {todoLists.length > 0 && currentList ? (
        <motion.div
          ref={constraintRef}
          className="flex-1 relative overflow-hidden min-h-0"
          style={{ opacity: dragOpacity }}
        >
          <motion.div
            className="absolute inset-0"
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.2}
            onDragEnd={handleDragEnd}
            style={{ x: dragX }}
          >
            <AnimatePresence initial={false} custom={direction} mode="popLayout">
              <SingleListView
                key={currentList.id}
                list={currentList}
                todos={listTodos}
                onComplete={handleCompleteTodo}
                onAdd={onAdd}
                onDelete={handleDeleteCurrentList}
                onRename={(name) => onRenameList(currentList.id, name)}
                onRecolor={(color) => onRecolorList(currentList.id, color)}
                direction={direction}
              />
            </AnimatePresence>
          </motion.div>
        </motion.div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <p className="text-[12px] text-[var(--muted-foreground)]">
            No lists yet. Create one!
          </p>
        </div>
      )}
    </div>
  );
}

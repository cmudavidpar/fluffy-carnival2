// frontend/src/App.tsx
import React, {useEffect, useState} from 'react';
import axios from 'axios';
import {Task} from '../../common/types';
import {TextField, Button} from '@mui/material';
import {DatePicker} from '@mui/x-date-pickers/DatePicker';
import {LocalizationProvider} from '@mui/x-date-pickers/LocalizationProvider';
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFnsV3";


function App() {
    const [tasks, setTasks] = useState<Map<string, Task>>(new Map<string, Task>());
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [newTaskDescription, setNewTaskDescription] = useState('');
    const [newTaskDueDate, setNewTaskDueDate] = useState<Date | null>(null);
    const [editTaskId, setEditTaskId] = useState<string | null>(null);
    const [editTaskTitle, setEditTaskTitle] = useState('');
    const [editTaskDescription, setEditTaskDescription] = useState('');
    const [editTaskDueDate, setEditTaskDueDate] = useState<Date | null>(null);
    const [loading, setLoading] = useState<boolean>(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const dateFormatOptions: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timeZoneName: 'short',
    };

    const baseUrl = 'http://localhost:5000';
    const fetchTasks = async (page: number = currentPage) => {
        setLoading(true);
        try {
            let response = await axios.get(`${baseUrl}/tasks`, {
                params: {
                    page,
                    limit: 10
                }
            });
            if(response.data.tasks.length === 0 && page > 1) {
              response = await axios.get(`${baseUrl}/tasks`, {
                params: {
                  page: page - 1,
                  limit: 10
                }
              });
            }

            setTasks(new Map(response.data.tasks.map((task: Task) => [task._id!, task])));
            setCurrentPage(response.data.currentPage);
            setTotalPages(response.data.totalPages);
        } catch (error) {
            console.error("Failed to fetch tasks", error);
            alert("Failed to fetch tasks.");
        } finally {
            setLoading(false);
        }
    };

    const addTask = async () => {
        if (!newTaskTitle) {
            alert("Please enter a title.");
            return;
        }
        if (!newTaskDueDate) {
            alert("Please select a due date.");
            return;
        }
        try {
            await axios.post(`${baseUrl}/tasks`, {
                title: newTaskTitle,
                description: newTaskDescription,
                dueDate: newTaskDueDate,
            });
            setNewTaskTitle('');
            setNewTaskDescription('');
            setNewTaskDueDate(null);
            await fetchTasks();
        } catch (error: any) {
            console.error("Failed to add task", error);
            alert(error.response?.data?.error || "Failed to add task.");
        }
    };

    const handleNextPage = () => {
        if (currentPage < totalPages) {
            fetchTasks(currentPage + 1);
        }
    };

    const handlePrevPage = () => {
        if (currentPage > 1) {
            fetchTasks(currentPage - 1);
        }
    };
    const deleteTask = async (id: string) => {
        await axios.delete(`${baseUrl}/tasks/${id}`);
        await fetchTasks();
    };

    const startEdit = (item: Task) => {
        setEditTaskId(item._id || null);
        setEditTaskTitle(item.title);
        setEditTaskDescription(item.description);
        setEditTaskDueDate(item.dueDate);
    };

    const cancelEdit = () => {
        setEditTaskId(null);
        setEditTaskTitle('');
        setEditTaskDescription('');
        setEditTaskDueDate(null);
    };
    const updateTask = async () => {
        if (!editTaskTitle) {
            alert("Please enter a title.");
            return;
        }
        if (!editTaskDueDate) {
            alert("Please select a due date.");
            return;
        }
        try {
            await axios.put(`${baseUrl}/tasks/${editTaskId}`, {
                title: editTaskTitle,
                description: editTaskDescription,
                dueDate: editTaskDueDate,
            });
            setEditTaskId(null);
            await fetchTasks();
        } catch (error: any) {
            console.error("Failed to update task", error);
            if (error.response?.status === 404) {
                // Task not found, delete it from the state
                setTasks(prevTasks => {
                    const newTasks = new Map(prevTasks);
                    newTasks.delete(editTaskId!);
                    return newTasks;
                });
                alert("Task not found.");
            } else {
                alert(error.response?.data?.error || "Failed to update task.");
            }
        }
    };

    useEffect(() => {
        fetchTasks()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="container">
            <h1>Task Manager</h1>
            <div>
                <TextField
                    sx={{m: 0, width: '25%'}}
                    placeholder="Title"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    fullWidth
                    margin="normal"
                />
                <TextField
                    sx={{m: 0, width: '25%'}}
                    placeholder="Description"
                    value={newTaskDescription}
                    onChange={(e) => setNewTaskDescription(e.target.value)}
                    fullWidth
                    margin="normal"
                />
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <DatePicker
                        label="Select due date"
                        value={newTaskDueDate}
                        onChange={(date: React.SetStateAction<Date | null>) => setNewTaskDueDate(date)}
                    />
                </LocalizationProvider>
                <Button sx={{m: 1}} variant="contained" color="primary" onClick={addTask}>Add Task</Button>
            </div>
            <ul>
                {Array.from(tasks.values()).map((task) => (
                    <li key={task._id}>
                        {editTaskId === task._id ? (
                            <div>
                                <TextField
                                    sx={{m: 0, width: '25%'}}
                                    value={editTaskTitle}
                                    onChange={(e) => setEditTaskTitle(e.target.value)}
                                    fullWidth
                                    margin="normal"
                                />
                                <TextField
                                    sx={{m: 0, width: '25%'}}
                                    value={editTaskDescription}
                                    onChange={(e) => setEditTaskDescription(e.target.value)}
                                    fullWidth
                                    margin="normal"
                                />
                                <LocalizationProvider dateAdapter={AdapterDateFns}>
                                    <DatePicker
                                        label="Select due date"
                                        value={new Date(editTaskDueDate || '')}
                                        onChange={(date: React.SetStateAction<Date | null>) => setEditTaskDueDate(date)}
                                    />
                                </LocalizationProvider>
                                <Button sx={{m: 1}} variant="contained" color="primary"
                                        onClick={updateTask}>Update</Button>
                                <Button sx={{m: 1}} variant="contained" color="secondary"
                                        onClick={cancelEdit}>Cancel</Button>
                            </div>
                        ) : (
                            <div>
                                [{task.title}] - {task.description} - Due
                                On {new Date(task.dueDate).toLocaleDateString(undefined, dateFormatOptions)}
                                <Button sx={{m: 1}} variant="contained" color="primary"
                                        onClick={() => startEdit(task)}>Edit</Button>
                                <Button sx={{m: 1}} variant="contained" color="secondary"
                                        onClick={() => deleteTask(task._id || '')}>Delete</Button>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            <div className="pagination">
                {totalPages > 0 && (
                    <>
                        <Button
                            variant="contained"
                            onClick={handlePrevPage}
                            disabled={loading || currentPage === 1}
                        >
                            Previous
                        </Button>
                        <span>Page {currentPage} of {totalPages}</span>
                        <Button
                            variant="contained"
                            onClick={handleNextPage}
                            disabled={loading || currentPage === totalPages}
                        >
                            Next
                        </Button>
                    </>
                )}
            </div>
        </div>
    );
}

export default App;
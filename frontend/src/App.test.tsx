import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import axios from 'axios';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3';

// Mock axios
jest.mock('axios');
const mockedAxios = jest.mocked(axios, true );

mockedAxios.get.mockResolvedValue({ data: {} });

// Mock task data with pagination
const mockTasksResponse = {
  tasks: [
    {
      _id: '1',
      title: 'Test Task',
      description: 'Test Description',
      dueDate: new Date('2024-03-20').toISOString(),
    }
  ],
  total: 1,
  currentPage: 1,
  totalPages: 1
};

describe('App Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockResolvedValue({ data: mockTasksResponse });
  });

  const renderApp = () => {
    return render(
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <App />
        </LocalizationProvider>
    );
  };

  test('renders task manager title', () => {
    renderApp();
    expect(screen.getByText('Task Manager')).toBeInTheDocument();
  });

  test('loads and displays tasks with pagination', async () => {
    renderApp();
    await waitFor(() => {
      expect(screen.getByText(/Test Task/)).toBeInTheDocument();
      expect(screen.getByText(/Test Description/)).toBeInTheDocument();
      expect(screen.getByText('Page 1 of 1')).toBeInTheDocument();
    });
  });

  test('hides pagination when no tasks exist', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        tasks: [],
        total: 0,
        currentPage: 1,
        totalPages: 0
      }
    });

    renderApp();
    await waitFor(() => {
      expect(screen.queryByText('Previous')).not.toBeInTheDocument();
      expect(screen.queryByText('Next')).not.toBeInTheDocument();
    });
  });

  test('handles pagination navigation', async () => {
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        tasks: [{ _id: '1', title: 'Task 1', description: 'Desc 1', dueDate: new Date().toISOString() }],
        total: 15,
        currentPage: 1,
        totalPages: 2
      }
    });

    renderApp();
    await waitFor(() => {
      expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();
    });

    // Mock second page response
    mockedAxios.get.mockResolvedValueOnce({
      data: {
        tasks: [{ _id: '2', title: 'Task 2', description: 'Desc 2', dueDate: new Date().toISOString() }],
        total: 15,
        currentPage: 2,
        totalPages: 2
      }
    });

    // Navigate to next page
    await userEvent.click(screen.getByText('Next'));

    await waitFor(() => {
      expect(screen.getByText('Page 2 of 2')).toBeInTheDocument();
      expect(mockedAxios.get).toHaveBeenCalledWith('http://localhost:5000/tasks', {
        params: { page: 2, limit: 10 }
      });
    });
  });

  test('adds a new task', async () => {
    mockedAxios.post.mockResolvedValueOnce({
      data: { _id: 'new-id', title: 'New Task', description: 'New Description', dueDate: new Date().toISOString() }
    });

    renderApp();

    await userEvent.type(screen.getByPlaceholderText('Title'), 'New Task');
    await userEvent.type(screen.getByPlaceholderText('Description'), 'New Description');
    await userEvent.type(screen.getByLabelText('Select due date'), '2024-03-20');
    await userEvent.click(screen.getByText('Add Task'));

    expect(mockedAxios.post).toHaveBeenCalledWith(
        'http://localhost:5000/tasks',
        expect.any(Object)
    );

    // Verify that tasks are refreshed after adding
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  test('deletes a task', async () => {
    mockedAxios.delete.mockResolvedValueOnce({});
    renderApp();

    await waitFor(() => {
      const deleteButton = screen.getByText('Delete');
      fireEvent.click(deleteButton);
    });

    expect(mockedAxios.delete).toHaveBeenCalledWith('http://localhost:5000/tasks/1');
    // Verify that tasks are refreshed after deletion
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  test('edits a task', async () => {
    mockedAxios.put.mockResolvedValueOnce({
      data: { _id: '1', title: 'Updated Task', description: 'Updated Description', dueDate: new Date().toISOString() }
    });

    renderApp();

    await waitFor(() => {
      fireEvent.click(screen.getByText('Edit'));
    });

    const titleInput = screen.getByDisplayValue('Test Task');
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, 'Updated Task');

    await userEvent.click(screen.getByText('Update'));

    expect(mockedAxios.put).toHaveBeenCalledWith(
        'http://localhost:5000/tasks/1',
        expect.any(Object)
    );

    // Verify that tasks are refreshed after update
    expect(mockedAxios.get).toHaveBeenCalledTimes(2);
  });

  test('handles API errors', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    mockedAxios.get.mockRejectedValueOnce(new Error('API Error'));
    renderApp();

    await waitFor(() => {
      expect(alertMock).toHaveBeenCalledWith('Failed to fetch tasks.');
    });

    consoleSpy.mockRestore();
    alertMock.mockRestore();
  });
});
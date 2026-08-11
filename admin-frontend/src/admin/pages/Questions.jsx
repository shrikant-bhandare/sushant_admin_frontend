import React, { useState, useEffect } from "react";
import axios from "axios";
import { FaEdit, FaSave, FaTrash, FaPlus } from "react-icons/fa";
import { useTheme } from "../context/ThemeContext";
import { getAuthAxiosConfig } from '../../utils/authUtils';

const Questions = () => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [filters, setFilters] = useState({
    questionText: "",
    userId: "",
  });
  const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
  const [isDeletePopupOpen, setIsDeletePopupOpen] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    questionText: "",
    answer: "",
    options: [],
    isRequired: false, // Add this line
  });
  const [newOption, setNewOption] = useState("");

  const { isDarkMode } = useTheme();

  useEffect(() => {
    fetchQuestions();
  }, [currentPage, pageSize, filters]);

  const fetchQuestions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${import.meta.env.VITE_APIURL}/question`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          page: currentPage,
          pageSize,
          ...filters,
        },
      });
      setQuestions(response.data.result);
      setTotalQuestions(response.data.result.length); // Assuming total questions count is in the response
    } catch (error) {
      console.error("Failed to fetch questions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (page) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (event) => {
    setPageSize(Number(event.target.value));
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value,
    });
  };

  const handleEdit = (question) => {
    setCurrentQuestion(question); // Set the current question to be edited
    setIsEditPopupOpen(true); // Open the edit popup
  };

  const handleSave = async (questionId) => {
    try {
      const authConfig = getAuthAxiosConfig();
      const response = await axios.put(
        `${import.meta.env.VITE_APIURL}/question/${questionId}`,
        {
          questionText: currentQuestion.questionText,
          answer: currentQuestion.answer,
          options: currentQuestion.options,
        },
        {
          ...authConfig,
          headers: {
            ...authConfig.headers,
            isvalidrequest: "rainbowAuth123",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status) {
        console.log(
          "Question updated successfully:",
          response.data.result.question
        );
        fetchQuestions(); // Refresh the questions list
        setIsEditPopupOpen(false);
      } else {
        console.error("Failed to update question:", response.data.message);
      }
    } catch (error) {
      console.error("Error updating question:", error);
    }
  };

  const handleDelete = (question) => {
    setCurrentQuestion(question);
    setIsDeletePopupOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const authConfig = getAuthAxiosConfig();
      const response = await axios.delete(
        `${import.meta.env.VITE_APIURL}/question/${currentQuestion._id}`,
        {
          ...authConfig,
          headers: {
            ...authConfig.headers,
            isvalidrequest: "rainbowAuth123",
            "Content-Type": "application/json",
          },
        }
      );
      if (response.status === 200) {
        console.log("Question deleted successfully:", response.data.result);
        fetchQuestions(); // Refresh the questions list
        setIsDeletePopupOpen(false);
      } else {
        console.error("Failed to delete question:", response.data.message);
      }
    } catch (error) {
      console.error("Error deleting question:", error);
    }
  };

  const handleNewQuestionChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === "checkbox" ? checked : value;
    if (currentQuestion) {
      setCurrentQuestion({
        ...currentQuestion,
        [name]: newValue,
      });
    } else {
      setNewQuestion({
        ...newQuestion,
        [name]: newValue,
      });
    }
  };

  const handleAddQuestion = async () => {
    try {
      const authConfig = getAuthAxiosConfig();
      const response = await axios.post(
        `${import.meta.env.VITE_APIURL}/question`,
        {
          question: newQuestion.questionText,
          options: newQuestion.options,
          isRequired: newQuestion.isRequired, // Add this line
        },
        {
          ...authConfig,
          headers: {
            ...authConfig.headers,
            isvalidrequest: "rainbowAuth123",
            "Content-Type": "application/json",
          },
        }
      );

      if (response.data.status) {
        console.log(
          "Question created successfully:",
          response.data.result.question
        );
        fetchQuestions(); // Refresh the questions list
        setIsEditPopupOpen(false);
      } else {
        console.error("Failed to create question:", response.data.message);
      }
    } catch (error) {
      console.error("Error creating question:", error);
    }
  };

  const handleAddQuestionClick = () => {
    setNewQuestion({
      questionText: "",
      answer: "",
      options: [],
    });
    setCurrentQuestion(null);
    setIsEditPopupOpen(true);
  };

  const handleNewOptionChange = (e) => {
    setNewOption(e.target.value);
  };

  const handleAddOption = () => {
    if (currentQuestion) {
      setCurrentQuestion({
        ...currentQuestion,
        options: [...currentQuestion.options, { answer: newOption }],
      });
    } else {
      setNewQuestion({
        ...newQuestion,
        options: [...newQuestion.options, { answer: newOption }],
      });
    }
    setNewOption("");
  };

  const handleRemoveOption = (index) => {
    if (currentQuestion) {
      const updatedOptions = currentQuestion.options.filter(
        (_, i) => i !== index
      );
      setCurrentQuestion({
        ...currentQuestion,
        options: updatedOptions,
      });
    } else {
      const updatedOptions = newQuestion.options.filter((_, i) => i !== index);
      setNewQuestion({
        ...newQuestion,
        options: updatedOptions,
      });
    }
  };

  const handleOptionChange = (index, value) => {
    if (currentQuestion) {
      const updatedOptions = [...currentQuestion.options];
      updatedOptions[index].answer = value;
      setCurrentQuestion({
        ...currentQuestion,
        options: updatedOptions,
      });
    } else {
      const updatedOptions = [...newQuestion.options];
      updatedOptions[index].answer = value;
      setNewQuestion({
        ...newQuestion,
        options: updatedOptions,
      });
    }
  };

  const columns = [
    {
      title: "Question Text",
      dataIndex: "question",
      key: "question",
    },

    {
      title: "Options",
      key: "options",
      render: (text, record) => (
        <div>
          {record.options.map((option) => (
            <div className="py-2" key={option._id}>
              {option.answer}
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <div className="flex space-x-2">
          <button onClick={() => handleEdit(record)} className="text-blue-500">
            <FaEdit />
          </button>
          <button onClick={() => handleDelete(record)} className="text-red-500">
            <FaTrash />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div
      className={`p-4 rounded-md ${
        isDarkMode ? "bg-gray-800 text-white" : "bg-white text-black"
      }`}
    >
      <div
        className={`mb-4 rounded-md p-4 flex justify-between items-center ${
          isDarkMode ? "bg-gray-700" : "bg-white"
        }`}
      >
        <div className="flex space-x-4">
          <input
            type="text"
            placeholder="Filter by Question Text"
            name="questionText"
            value={filters.questionText}
            onChange={handleFilterChange}
            className={`p-2 border rounded ${
              isDarkMode
                ? "border-gray-600 bg-gray-700 text-white"
                : "border-gray-300"
            }`}
          />
          <input
            type="text"
            placeholder="Filter by User ID"
            name="userId"
            value={filters.userId}
            onChange={handleFilterChange}
            className={`p-2 border rounded ${
              isDarkMode
                ? "border-gray-600 bg-gray-700 text-white"
                : "border-gray-300"
            }`}
          />
          <button
            onClick={fetchQuestions}
            className={`p-2 shadow-[0_8px_8px_rgba(0,0,0,0.4)] text-white rounded ${
              isDarkMode ? "bg-blue-700" : "bg-blue-500"
            }`}
          >
            Search
          </button>
          <button
            onClick={() => setFilters({ questionText: "", userId: "" })}
            className={`p-2 shadow-[0_8px_8px_rgba(0,0,0,0.4)] text-white rounded ${
              isDarkMode ? "bg-gray-700" : "bg-gray-500"
            }`}
          >
            Reset
          </button>
        </div>
        <button
          onClick={handleAddQuestionClick}
          className={`p-2 flex items-center shadow-[0_8px_8px_rgba(0,0,0,0.4)] gap-5 text-white rounded ${
            isDarkMode ? "bg-green-700" : "bg-green-500"
          }`}
        >
          <FaPlus /> Add Question
        </button>
      </div>
      <table
        className={`min-w-full rounded-md ${
          isDarkMode ? "bg-gray-700" : "bg-white"
        }`}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={`py-2 px-4 border-b text-left ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {questions && questions.length > 0 ? (
            questions.map((question) => (
              <tr
                key={question._id}
                className={`hover:${
                  isDarkMode ? "bg-gray-600" : "bg-gray-100"
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={`py-2 px-4 border-b text-left ${
                      isDarkMode ? "border-gray-600" : "border-gray-200"
                    }`}
                  >
                    {col.render
                      ? col.render(question[col.dataIndex], question)
                      : question[col.dataIndex]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td
                colSpan={columns.length}
                className={`py-2 px-4 border-b text-center ${
                  isDarkMode ? "border-gray-600" : "border-gray-200"
                }`}
              >
                No questions found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="mt-4 flex justify-between items-center">
        <div>
          <label htmlFor="pageSize" className="mr-2">
            Page Size:
          </label>
          <select
            id="pageSize"
            value={pageSize}
            onChange={handlePageSizeChange}
            className={`p-2 border rounded ${
              isDarkMode
                ? "border-gray-600 bg-gray-700 text-white"
                : "border-gray-300"
            }`}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div>
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`p-2 border rounded mr-2 ${
              isDarkMode
                ? "border-gray-600 bg-gray-700 text-white"
                : "border-gray-300"
            }`}
          >
            Previous
          </button>
          <span>{currentPage}</span>
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage * pageSize >= totalQuestions}
            className={`p-2 border rounded ml-2 ${
              isDarkMode
                ? "border-gray-600 bg-gray-700 text-white"
                : "border-gray-300"
            }`}
          >
            Next
          </button>
        </div>
      </div>

      {isEditPopupOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-center">
          <div
            className={` p-4 rounded-md max-w-[440px] w-full ${
              isDarkMode ? "bg-gray-700 text-white" : "bg-white text-black"
            }`}
          >
            <h2 className="text-xl mb-4 text-center">
              {currentQuestion ? "Edit Question" : "Add Question"}
            </h2>
            <input
              type="text"
              name="questionText"
              placeholder="Question Text"
              value={
                currentQuestion
                  ? currentQuestion.question
                  : newQuestion.question
              }
              onChange={handleNewQuestionChange}
              className={`p-2 border rounded mb-2 w-full ${
                isDarkMode
                  ? "border-gray-600 bg-gray-700 text-white"
                  : "border-gray-300"
              }`}
            />

            <div className="mb-4">
              <h3 className="text-lg mb-2">Options</h3>
              {currentQuestion
                ? currentQuestion.options.map((option, index) => (
                    <div
                      key={option._id}
                      className="flex justify-between items-center mb-2"
                    >
                      <input
                        type="text"
                        value={option.answer}
                        onChange={(e) =>
                          handleOptionChange(index, e.target.value)
                        }
                        className={`p-2 border rounded w-full ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-700 text-white"
                            : "border-gray-300"
                        }`}
                      />
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className={`ml-2 p-2 text-white rounded ${
                          isDarkMode ? "bg-red-700" : "bg-red-500"
                        }`}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                : newQuestion.options.map((option, index) => (
                    <div
                      key={option._id}
                      className="flex justify-between items-center mb-2"
                    >
                      <input
                        type="text"
                        value={option.answer}
                        onChange={(e) =>
                          handleOptionChange(index, e.target.value)
                        }
                        className={`p-2 border rounded w-full ${
                          isDarkMode
                            ? "border-gray-600 bg-gray-700 text-white"
                            : "border-gray-300"
                        }`}
                      />
                      <button
                        onClick={() => handleRemoveOption(index)}
                        className={`ml-2 p-2 text-white rounded ${
                          isDarkMode ? "bg-red-700" : "bg-red-500"
                        }`}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
              <div className="flex space-x-2">
                <input
                  type="text"
                  placeholder="New Option"
                  value={newOption}
                  onChange={handleNewOptionChange}
                  className={`p-2 border rounded w-full ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300"
                  }`}
                />
                <button
                  onClick={handleAddOption}
                  className={`p-2 text-white rounded ${
                    isDarkMode ? "bg-green-700" : "bg-green-500"
                  }`}
                >
                  Add Option
                </button>
              </div>
            </div>
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isRequired"
                  checked={
                    currentQuestion
                      ? currentQuestion.isRequired
                      : newQuestion.isRequired
                  }
                  onChange={handleNewQuestionChange}
                  className={`mr-2 ${
                    isDarkMode
                      ? "border-gray-600 bg-gray-700 text-white"
                      : "border-gray-300"
                  }`}
                />
                Is Required
              </label>
            </div>
            <div className="flex justify-center space-x-4">
              <button
                onClick={
                  currentQuestion
                    ? () => handleSave(currentQuestion._id)
                    : handleAddQuestion
                }
                className={`p-2 text-white rounded ${
                  isDarkMode ? "bg-blue-700" : "bg-blue-500"
                }`}
              >
                {currentQuestion ? "Save" : "Add"}
              </button>
              <button
                onClick={() => setIsEditPopupOpen(false)}
                className={`p-2 text-white rounded ${
                  isDarkMode ? "bg-red-700" : "bg-red-500"
                }`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {isDeletePopupOpen && (
        <div className="fixed inset-0 bg-gray-800 bg-opacity-75 flex justify-center items-center">
          <div
            className={` p-6 rounded-lg shadow-lg max-w-md w-full ${
              isDarkMode ? "bg-gray-700 text-white" : "bg-white text-black"
            }`}
          >
            <h2 className="text-2xl font-semibold mb-4 text-center">
              Confirm Delete
            </h2>
            <p
              className={`mb-6 text-center ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Are you sure you want to delete this question?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={confirmDelete}
                className={`px-4 py-2 text-white rounded-lg hover:bg-red-700 transition duration-200 ${
                  isDarkMode ? "bg-red-700" : "bg-red-600"
                }`}
              >
                Yes
              </button>
              <button
                onClick={() => setIsDeletePopupOpen(false)}
                className={`px-4 py-2 text-white rounded-lg hover:bg-gray-700 transition duration-200 ${
                  isDarkMode ? "bg-gray-700" : "bg-gray-600"
                }`}
              >
                No
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Questions;

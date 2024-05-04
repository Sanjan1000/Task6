Rails.application.routes.draw do
  mount ActionCable.server => '/cable'
  root 'pages#home'
end
